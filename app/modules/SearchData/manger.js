import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import AccountModel from "../../models/account";
import BlockModel from "../../models/block";
import TokenModel from "../../models/contract";
import { genericConstants, amqpConstants } from '../../common/constants';
import RabbitMqController from "../queue/index";
import Config from "../../../config";
import WebSocketService from "../../service/WebsocketService";
let ERC20ABI = require("./jsonInterface").ERC20ABI;
let ERCvalue = 0

export default class Manger {

    searchData = async (params) => {
        Utils.lhtLog("BLManager:searchBlockchainData", "searchBlockchainData started", "", "");
        let { filter, data } = params;
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
            responseStatus.push({ 'message': 'Data not found' })
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
            data=data.toLowerCase();
            const findObjToken = { "address": data, "ERC": { $gte: 2 }
            };
            const token = await TokenModel.find(findObjToken);
            if (token && token.length>0) {
                responseStatus.push({ 'redirect': 'token', token })
                return responseStatus;
            }
           responseStatus = await this.searchAddress(data)
            return responseStatus;
        }
        if (!type) {
            const findObjToken = { "tokenName": data, "ERC": { $gte: 2 }
         };
            const token = await TokenModel.find(findObjToken);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
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
           responseStatus= await this.searchBlock(data)
           return responseStatus;

        }
        return responseStatus;
    }



    searchBlock = async (data) => {
        let responseStatus = []
        data=parseInt(data);
        let findObjBlock = { "number": data };
        let block = await BlockModel.findOne(findObjBlock);
        if (block) {
            responseStatus.push({ 'redirect': 'block', block })
            return responseStatus;
        }
        block = await this.getBlockDataFromSocket(data, genericConstants.REQUEST_TYPE.BLOCK)
        if(block)
        responseStatus.push({ 'redirect': 'block', block })
        return responseStatus;
    }

  async searchAddress (data) {
        try{
            data=data.toLowerCase();
        // web3 = await WebSocketService.webSocketConnection("wss://LeewayHertzXDCWS.BlocksScan.io");   
        let responseStatus = []
        // const code =await web3.eth.getCode(data)
        // return new Promise(async function(resolve, reject) {
           
        // if (code === "0x") {
          
            const findObjAddresses = { "address": data };
            let account = await AccountModel.getAccount(findObjAddresses);
            console.log(account, "account");
            if (account) {
                responseStatus.push({ 'redirect': 'account', account })
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
                "ERC": { $gte: 2 }
            };
            let token = await TokenModel.findOne(findObj);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
                return responseStatus;
            }
            const code =await web3.eth.getCode(data);
            let response;
            if(code==="0x"){
              response = await this.getAddressDataFromSocket(data)
              if(response)
              responseStatus.push({ 'redirect': 'account', account:response })
            }
            else
             { response = await this.getTokenDataFromSocket(data)
                if(response)
                responseStatus.push({ 'redirect': 'token', token:response })
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
    }catch(error)
    {
        if(error && error.message === 'connection not open on send()'){
            web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
            return await this.searchAddress(data)
            }
            else throw error
    }

    }

 

    searchTokens = async (data, type) => {
        let responseStatus = []

        const findObj = {
            "address": data.toLowerCase(),
            "ERC": { $gte: 2 }
        };
        if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
            let token = await TokenModel.findOne(findObj);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
            }
            token = await this.getTokenDataFromSocket(data)
            if(token)
            responseStatus.push({ 'redirect': 'token', token })
            return responseStatus;

        }
        else {
            let findObjToken = { "tokenName": data, "ERC": { $gte: 2 } };
            let token = await TokenModel.findOne(findObjToken);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
                return responseStatus;
            }
        }
        return responseStatus;

    }

    searchTransaction = async (data) => {
        let responseStatus = []
        data=data.toLowerCase();
        const findObj = { "hash": data };
        let transaction = await TransactionModel.findOne(findObj);
        if (transaction) {
            responseStatus.push({ 'redirect': 'transaction', transaction })
            return responseStatus;
        }
        transaction = await this.getTransactionDataFromSocket(data, genericConstants.REQUEST_TYPE.TRANSACTION)
        if(transaction)
        responseStatus.push({ 'redirect': 'transaction', transaction })
        return responseStatus;

    }
    searchAccount = async (data) => {
        let responseStatus = []
        data=data.toLowerCase();
        const findObj = {
            "address": data
        };
        let account = await AccountModel.findOne(findObj);
        if (account) {
            responseStatus.push({ 'redirect': 'address', account })
        }
        account =await this.getBlockDataFromSocket(data)
        if(account)
        responseStatus.push({ 'redirect': 'address', account })
        return responseStatus;

    }
    getTransactionDataFromSocket = async (data) => {
        try {
            let rabbitMqController = new RabbitMqController();
            const transaction = await web3.eth.getTransactionReceipt(data);
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
                gas:  0,
                gasPrice: 0,
                input:  "",
                nonce: 0,
                value: "",
                r:  "",
                s: "",
                v: "",
                timestamp:  0,
                modifiedOn:Date.now(),
                createdOn: Date.now(),
                isDeleted: false,
                isActive: true
            }

            rabbitMqController.insertInQueue(Config.SYNC_TRANSACTION_EXCHANGE, Config.SYNC_TRANSACTION_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify([transactionObj]));
            return transactionObj;
        }
        catch (error) {
            if(error && error.message === 'connection not open on send()'){
            web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
            return await this.getTransactionDataFromSocket(data)
            }
            else throw error
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
            }
        catch (error) {
            if(error && error.message === 'connection not open on send()'){
            web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
            return await this.getAddressDataFromSocket(data)
            }
            else 
            throw error
        }
    }

    getTokenDataFromSocket = async (data) =>{
        try{
            let rabbitMqController = new RabbitMqController();
            const call = await web3.eth.call({ to: data, data: web3.utils.sha3("totalSupply()") });
            let contractObj = {}
            contractObj.address = data;
            contractObj.isTokenContract = false;
            contractObj.byteCode = await web3.eth.getCode(data);
            if(call !== "0x"){
            const token = new web3.eth.Contract(ERC20ABI, data);
            contractObj.tokenName = await token.methods.name().call();
            contractObj.symbol = await token.methods.symbol().call();
            contractObj.decimals = await token.methods.decimals().call();
            contractObj.totalSupply = await token.methods.totalSupply().call();
            contractObj.isTokenContract = true;
            }
            else{
            contractObj.tokenName = ""
            contractObj.symbol = ""
            contractObj.decimals = ""
            contractObj.totalSupply = ""
            }
            contractObj.blockNumber =0;
            contractObj.creationTransaction =  "" ;
            contractObj.contractName = "" ;
            contractObj.owner= "" ;
            contractObj.compilerVersion= "" ;
            contractObj.optimization= false ;
            contractObj.sourceCode="" ;
            contractObj.abi= "" ;
            contractObj.createdOn= Date.now() ;
            contractObj.modifiedOn= Date.now() ;
            contractObj.isActive= true ;
            contractObj.isDeleted= false ;
            contractObj.ERC = await getERC(contractObj.isTokenContract);
            rabbitMqController.insertInQueue(Config.SYNC_CONTRACT_EXCHANGE, Config.SYNC_CONTRACT_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(contractObj));
            if(call!=="0x")
            rabbitMqController.insertInQueue(Config.SYNC_TOKEN_EXCHANGE, Config.SYNC_TOKEN_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(contractObj));
            return contractObj;
        } catch (error) {
            if(error && error.message === 'connection not open on send()'){
            web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
            return await this.getTokenDataFromSocket(data)
            }
            else throw error
        }
         
    }

    getBlockDataFromSocket = async (data) => {
        try {
            let rabbitMqController = new RabbitMqController();
            const blockResult = await web3.eth.getBlock(data + "", true);
            rabbitMqController.insertInQueue(Config.SYNC_BLOCK_EXCHANGE, Config.SYNC_BLOCK_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(blockResult));
            return blockResult;
        }
        catch (error) {
            if(error && error.message === 'connection not open on send()'){
            web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
             return await this.getBlockDataFromSocket(data)
          
            } 
            else throw error

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



