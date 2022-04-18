import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import AccountModel from "../../models/account";
import BlockModel from "../../models/block";
import TokenModel from "../../models/contract";
import {amqpConstants, genericConstants, httpConstants} from '../../common/constants';
import RabbitMqController from "../queue/index";
import Config from "../../../config";
import WebSocketService from "../../service/WebsocketService";
import Contract from "../contract/index";

let ERC20ABI = require("./jsonInterface").ERC20ABI;
let ERCvalue = 0

export default class Manger {

    searchData = async (params) => {
        Utils.lhtLog("BLManager:searchBlockchainData", "searchBlockchainData started", "", "");
        let {filter, data} = params;
        let responseStatus = [], type = ""
        switch (filter) {
            case "All filters":
                type = this.checkDataType(data)
                responseStatus = await this.searchAllFilters(data, type);
                break;
            case "Blocks":
                responseStatus = await this.searchBlock(data);
                break;
            case "Addresses":
                responseStatus = await this.searchAddress(data);
                break;
            case "Tokens":
                type = this.checkDataType(data)
                responseStatus = await this.searchTokens(data, type);
                break;
            case "Transaction":
                responseStatus = await this.searchTransaction(data);
                break;

            default:
                responseStatus = await this.searchAccount(data);
                break;
        }

        if (responseStatus && responseStatus.length > 0) {
            return responseStatus
        } else {
            responseStatus.push({'message': 'Data not found'})
        }
        return responseStatus
    }

    checkDataType = (data) => {
        if (data.startsWith("xdc"))
            return genericConstants.REQUEST_TYPE.ADDRESS
        else if (data.startsWith("0x"))
            return genericConstants.REQUEST_TYPE.TRANSACTION
        else if (!isNaN(data))
            return genericConstants.REQUEST_TYPE.BLOCK
    }


    searchAllFilters = async (data, type) => {

        let responseStatus = [];
        if (type === genericConstants.REQUEST_TYPE.TRANSACTION) {
            responseStatus = await this.searchTransaction(data)
            return responseStatus;
        }
        if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
            data = data.toLowerCase();
            const findObjToken = {
                "address": data, "ERC": {$gte: 2}
            };
            const token = await TokenModel.find(findObjToken);
            if (token && token.length > 0) {
                responseStatus.push({'redirect': 'token', token})
                return responseStatus;
            }
            responseStatus = await this.searchAddress(data)
            return responseStatus;
        }
        if (!type) {
            const findObjToken = {
                $or: [{tokenName: {$regex: ".*" + data + ".*", $options: "i"}}, {
                    symbol: {
                        $regex: ".*" + data + ".*",
                        $options: "i"
                    }
                }], "ERC": {$gte: 2}
            };
            const token = await TokenModel.find(findObjToken);
            if (token) {
                responseStatus.push({'redirect': 'token', token})
                return responseStatus;
            }
        }
        // if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
        //     const findObj = {
        //         "address": data,
        //         "ERC": { $gte: 2 }
        //     };
        //     const token = await TokenModel.findOne(findObj);
        //     if (token) {
        //         responseStatus.push({ 'redirect': 'token', token })
        //         return responseStatus;
        //     }
        // }
        if (type === genericConstants.REQUEST_TYPE.BLOCK) {
            responseStatus = await this.searchBlock(data)
            return responseStatus;

        }
        return responseStatus;
    }


    searchBlock = async (data) => {
        let responseStatus = []
        data = parseInt(data);
        let findObjBlock = {"number": data};
        let block = await BlockModel.findOne(findObjBlock);
        if (block) {
            responseStatus.push({'redirect': 'block', block})
            return responseStatus;
        }
        block = await this.getBlockDataFromSocket(data, genericConstants.REQUEST_TYPE.BLOCK)
        if (block)
            responseStatus.push({'redirect': 'block', block})
        return responseStatus;
    }

    async searchAddress(data) {
        try {
            data = data.toLowerCase();
            // web3 = await WebSocketService.webSocketConnection("wss://LeewayHertzXDCWS.BlocksScan.io");
            let responseStatus = []
            // const code =await web3.eth.getCode(data)
            // return new Promise(async function(resolve, reject) {

            // if (code === "0x") {

            const findObjAddresses = {"address": data};
            let account = await AccountModel.getAccount(findObjAddresses);
            console.log(account, "account");
            if (account) {
                if(account.accountType === 1)
                    responseStatus.push({'redirect': 'contract', account})
                else 
                    responseStatus.push({'redirect': 'account', account})
                return responseStatus;
            }
            // account = await this.getAddressDataFromSocket(data)
            // if(account){
            // responseStatus.push({ 'redirect': 'account', account })
            // return responseStatus;
            // }
            // }
            const findObj = {
                "address": data,
                "ERC": {$gte: 2}
            };
            let token = await TokenModel.findOne(findObj);
            if (token) {
                responseStatus.push({'redirect': 'token', token})
                return responseStatus;
            }
            const code = await web3.eth.getCode(data);
            let response;
            if (code === "0x") {
                response = await this.getAddressDataFromSocket(data)
                if (response.accountType === 1)
                    responseStatus.push({'redirect': 'contract', account: response})
                else
                    responseStatus.push({'redirect': 'account', account: response})
            } else {
                response = await this.getTokenDataFromSocket(data)
                if (response)
                    responseStatus.push({'redirect': 'token', token: response})
            }
            return responseStatus;


            // if(response) 
            //    responseStatus.push({ 'redirect': 'token', token })
            // token = await this.getTokenDataFromSocket(data)
            // if(token){
            // responseStatus.push({ 'redirect': 'token', token })
            // return responseStatus;
            // }


            // });
        } catch (error) {
            if (error && error.message === 'connection not open on send()') {
                web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                return await this.searchAddress(data)
            } else throw error
        }

    }


    searchTokens = async (data, type) => {
        let responseStatus = []

        if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
            const findObj = {
                "address": data.toLowerCase(),
                "ERC": {$gte: 2}
            };
            let token = await TokenModel.findOne(findObj);
            if (token) {
                responseStatus.push({'redirect': 'token', token});
                return responseStatus;
            }
            token = await this.getTokenDataFromSocket(data)
            if (token)
                responseStatus.push({'redirect': 'token', token})
            return responseStatus;

        } else {
            const findObjToken = {
                $or: [{
                    tokenName: {
                        $regex: ".*" + data + ".*",
                        $options: "i"
                    }
                }, {symbol: {$regex: ".*" + data + ".*", $options: "i"}}], "ERC": {$gte: 2}
            }
            let token = await TokenModel.findOne(findObjToken);
            if (token) {
                responseStatus.push({'redirect': 'token', token})
                return responseStatus;
            }
        }
        return responseStatus;

    }

    searchTransaction = async (data) => {
        let responseStatus = []
        data = data.toLowerCase();
        const findObj = {"hash": data};
        let transaction = await TransactionModel.findOne(findObj);
        if (transaction) {
            responseStatus.push({'redirect': 'transaction', transaction})
            return responseStatus;
        }
        transaction = await this.getTransactionDataFromSocket(data, genericConstants.REQUEST_TYPE.TRANSACTION)
        if (transaction)
            responseStatus.push({'redirect': 'transaction', transaction})
        return responseStatus;

    }
    searchAccount = async (data) => {
        let responseStatus = []
        data = data.toLowerCase();
        const findObj = {
            "address": data
        };
        let account = await AccountModel.findOne(findObj);
        if (account) {
            responseStatus.push({'redirect': 'address', account})
        }
        account = await this.getBlockDataFromSocket(data)
        if (account)
            responseStatus.push({'redirect': 'address', account})
        return responseStatus;

    }
    getTransactionDataFromSocket = async (data) => {
        try {
            let rabbitMqController = new RabbitMqController();

            const transaction = await web3.eth.getTransactionReceipt(data);
            const transactionDetails = await web3.eth.getTransaction(data);

            let transactionObj = {
                blockHash: transaction.blockHash,
                blockNumber: transaction.blockNumber,
                hash: transaction.transactionHash,
                from: transaction.from,
                to: transaction.to,
                gasUsed: transaction.gasUsed,
                transactionIndex: transaction.transactionIndex,
                contractAddress: transaction.contractAddress,
                cumulativeGasUsed: transaction.cumulativeGasUsed,
                logs: transaction.logs,
                status: transaction.status,
                gas: transactionDetails.gas,
                gasPrice: transactionDetails.gasPrice,
                input: transactionDetails.input,
                nonce: transactionDetails.nonce,
                value: transactionDetails.value,
                r: transactionDetails.r,
                s: transactionDetails.s,
                v: transactionDetails.v,
                timestamp: 0,
                modifiedOn: Date.now(),
                createdOn: Date.now(),
                isDeleted: false,
                isActive: true
            }
            rabbitMqController.insertInQueue(Config.SYNC_TRANSACTION_EXCHANGE, Config.SYNC_TRANSACTION_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify([transactionObj]));
            return transactionObj;
        } catch (error) {
            if (error && error.message === 'connection not open on send()') {
                web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                return await this.getTransactionDataFromSocket(data)
            } else throw error
        }
    }

    getAddressDataFromSocket = async (data) => {
        try {
            let rabbitMqController = new RabbitMqController();
            const balance = await web3.eth.getBalance(data);
            const accountType = await getAccountType(data);
            let accountDetail = {
                address: data,
                balance: balance,
                accountType: accountType,
                timestamp: 0,
                createdOn: Date.now(),
                modifiedOn: Date.now(),
                isDeleted: false,
                isActive: true
            }
            rabbitMqController.insertInQueue(Config.SYNC_ACCOUNT_EXCHANGE, Config.SYNC_ACCOUNT_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(accountDetail));
            return accountDetail;
        } catch (error) {
            if (error && error.message === 'connection not open on send()') {
                web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                return await this.getAddressDataFromSocket(data)
            } else
                throw error
        }
    }

    getTokenDataFromSocket = async (data) => {
        try {
            let rabbitMqController = new RabbitMqController();
            const call = await web3.eth.call({to: data, data: web3.utils.sha3("totalSupply()")});
            let contractObj = {}
            contractObj.address = data;
            contractObj.isTokenContract = false;
            contractObj.byteCode = await web3.eth.getCode(data);
            if (call !== "0x") {
                const token = new web3.eth.Contract(ERC20ABI, data);
                contractObj.tokenName = await token.methods.name().call();
                contractObj.symbol = await token.methods.symbol().call();
                contractObj.decimals = await token.methods.decimals().call();
                contractObj.totalSupply = await token.methods.totalSupply().call();
                contractObj.isTokenContract = true;
            } else {
                contractObj.tokenName = ""
                contractObj.symbol = ""
                contractObj.decimals = ""
                contractObj.totalSupply = ""
            }
            contractObj.blockNumber = 0;
            contractObj.creationTransaction = "";
            contractObj.contractName = "";
            contractObj.owner = "";
            contractObj.compilerVersion = "";
            contractObj.optimization = false;
            contractObj.sourceCode = "";
            contractObj.abi = "";
            contractObj.createdOn = Date.now();
            contractObj.modifiedOn = Date.now();
            contractObj.isActive = true;
            contractObj.isDeleted = false;
            contractObj.ERC = await getERC(contractObj.isTokenContract);
            rabbitMqController.insertInQueue(Config.SYNC_CONTRACT_EXCHANGE, Config.SYNC_CONTRACT_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(contractObj));
            if (call !== "0x")
                rabbitMqController.insertInQueue(Config.SYNC_TOKEN_EXCHANGE, Config.SYNC_TOKEN_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(contractObj));
            return contractObj;
        } catch (error) {
            if (error && error.message === 'connection not open on send()') {
                web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                return await this.getTokenDataFromSocket(data)
            } else throw error
        }

    }

    getBlockDataFromSocket = async (data) => {
        try {
            let rabbitMqController = new RabbitMqController();
            const blockResult = await web3.eth.getBlock(data + "", true);
            rabbitMqController.insertInQueue(Config.SYNC_BLOCK_EXCHANGE, Config.SYNC_BLOCK_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(blockResult));
            try {
                if (!blockResult.transactions || blockResult.transactions.length <= 0 || !blockResult.timestamp) return blockResult;

                let transactionResponse = this.syncTransaction(blockResult.transactions, blockResult.timestamp);
            } catch (err) {
                Utils.lhtLog("syncBlocks", `Fetching block error ` + err, {}, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            }
            return blockResult;
        } catch (error) {
            if (error && error.message === 'connection not open on send()') {
                web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                return await this.getBlockDataFromSocket(data)

            } else throw error

        }
    }

    async syncTransaction(transactions, timestamp) {
        let index;
        let allTransactionData = [];

        for (index in transactions) {
            const receipt = await web3.eth.getTransactionReceipt(transactions[index].hash);
            const tx = await this.normalizeTX(transactions[index], receipt, timestamp);
            // console.log("receipt",tx)
            allTransactionData.push(tx);
            try {
                this.syncAccount(tx);
                Contract.getContract(transactions[index], receipt, timestamp);
            } catch (err) {
                console.log(err)
                Utils.lhtLog("getLastTransactions", "getLastTransactions catch", err, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
            }
        }
        let rabbitMqController = new RabbitMqController();
        rabbitMqController.insertInQueue(Config.SYNC_TRANSACTION_EXCHANGE, Config.SYNC_TRANSACTION_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(allTransactionData));
        return allTransactionData;

    }
    async normalizeTX(txData, receipt, timestamp) {
        if (!txData || !receipt || !timestamp)
            return;

        let contractAddress = ""
        if (receipt && receipt.contractAddress !== null) {
            contractAddress = receipt.contractAddress.toLowerCase();
        }

        let cumulativeGasUsed = 0;
        if (receipt && receipt.cumulativeGasUsed)
            cumulativeGasUsed = receipt.cumulativeGasUsed;

        let logs = [];
        if (receipt && receipt.logs.length > 0)
            logs = receipt.logs;

        let status = true;
        if (receipt && receipt.status) {
            status = receipt.status;
        }

        const tx = {
            blockHash: txData.blockHash || "",
            blockNumber: txData.blockNumber || 0,
            hash: txData.hash.toLowerCase() || "",
            from: txData.from.toLowerCase() || "",
            to: txData.to || "",
            gas: txData.gas || "",
            gasPrice: String(txData.gasPrice) || "",
            gasUsed: receipt.gasUsed || 0,
            input: txData.input || "",
            nonce: txData.nonce || 0,
            transactionIndex: txData.transactionIndex || 0,
            value: txData.value || "",
            r: txData.r || "",
            s: txData.s || "",
            v: txData.v || "",
            contractAddress: contractAddress || "",
            cumulativeGasUsed: cumulativeGasUsed || 0,
            logs: logs || [],
            status: status || false,
            timestamp: timestamp || 0,
            modifiedOn: Date.now(),
            createdOn: Date.now(),
            isDeleted: false,
            isActive: true,
        };

        if (txData.to) {
            tx.to = txData.to.toLowerCase() || "";
            return tx;
        } else if (txData.creates) {
            tx.creates = txData.creates.toLowerCase() || "";
            return tx;
        } else {
            tx.creates = receipt.contractAddress.toLowerCase() || "";
            return tx;
        }
    }

    async syncAccount(tx){
        try {
            if (!tx || !tx.from) return;
            const accounts = this.getAccountsFromTransaction(tx);
            let getAccountResponse;
            for (let index = 0; index < accounts.length; index++) {
                if (accounts[index] === "")
                    continue
                const balance =  await web3.eth.getBalance(accounts[index]);
                const accountType = await getAccountType(accounts[index]);
                Utils.lhtLog("syncAccount", "syncAccount requestObj "+accounts[index], {
                    balance,
                    accountType
                }, "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
                getAccountResponse = await this.getAccountDetails(accounts[index], balance, accountType, tx);
                Utils.lhtLog("syncAccount", "syncAccount getAccountResponse "+accounts[index], "", "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
                let rabbitMqController = new RabbitMqController();
                await rabbitMqController.insertInQueue(Config.SYNC_ACCOUNT_EXCHANGE, Config.SYNC_ACCOUNT_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(getAccountResponse));
            }
        } catch (error) {
            Utils.lhtLog("syncAccount", "syncAccount catch", "error:- " + error, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }
    }


    getAccountsFromTransaction(tx) {
        try {
            let accounts = [];
            accounts.push(tx.from);
            if (tx.to !== "") {
                accounts.push(tx.to);
            }

            if (tx.contractAddress !== "") {
                accounts.push(tx.contractAddress)
            }
            return accounts;
        } catch (error) {
            Utils.lhtLog("getAccountBalance", "getAccountBalance catch", "", "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }

    }

    async getAccountDetails(address, balance, accountType, tx) {
        try {
            return {
                address: address,
                accountType: accountType,
                balance: balance,
                timestamp: tx.timestamp,
                createdOn: Date.now(),
                modifiedOn: Date.now(),
                isDeleted: false,
                isActive: true,
            };
        } catch (error) {
            Utils.lhtLog("getAccountBalance", "getAccountDetails getAccountBalance catch ", error, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }

    }
}


async function getAccountType(address) {
    try {
        let type = 0;
        const code = await web3.eth.getCode(address);
        if (code.length > 2) type = 1;
        return type;
    } catch (error) {
        console.log(error, "error")
    }
}

async function getERC(isTokenContract) {
    ERCvalue = 0;
    if (isTokenContract) {
        ERCvalue = 2;
    }
    return ERCvalue;
}



