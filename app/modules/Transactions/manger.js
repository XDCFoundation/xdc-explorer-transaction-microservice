import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import TransactionHistoryModel from "../../models/historical";
import {amqpConstants, apiFailureMessage, httpConstants} from '../../common/constants';
import AddressModel from "../../models/account";
import AddressStatsModel from "../../models/addressStats";
import TokenHolderModel from "../../models/tokenHolders";
import NetworkDetailModel from '../../models/networkDetails';
import Config from '../../../config';
import HttpService from "../../service/http-service";
import moment from "moment";
import RabbitMqController from "../queue/index";

export default class Manger {
    getNetworkDetails = async () => {
        const findObj = {
            "isActive": true
        };
        Utils.lhtLog("BLManager:getNetworkDetails", "get getNetworkDetails ", "", "");
        return await NetworkDetailModel.getNetworkDetails(findObj);
    }
    getTransactionsForAddress = async (pathParameter, queryStringParameter) => {

        Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "getAccountDetailsUsingAddress started", "", "");

        let skip = parseInt(0),
            limit = parseInt(1),
            sortKey = "blockNumber",
            sortType = -1;
        let address = pathParameter && pathParameter.address.toLowerCase();
        if (queryStringParameter && queryStringParameter.skip)
            skip = parseInt(queryStringParameter.skip)

        if (queryStringParameter && queryStringParameter.limit)
            limit = parseInt(queryStringParameter.limit)

        if (queryStringParameter && queryStringParameter.sortKey)
            sortKey = queryStringParameter.sortKey

        if (queryStringParameter && queryStringParameter.sortType)
            sortType = parseInt(queryStringParameter.sortType)

        let responseTransaction = []

        Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction count", "", "");
        if (queryStringParameter && queryStringParameter.keyword != null && queryStringParameter.keyword != '') {
            let keyword = queryStringParameter.keyword
            let toTransaction = await TransactionModel.getTransactionList(
                {
                    $and: [{
                        to: address
                    }, {hash: {$regex: ".*" + keyword + ".*", $options: 'i'}}]
                }, "", skip, limit, {});
            let fromTransaction = await TransactionModel.getTransactionList(
                {
                    $and: [{
                        from: address
                    }, {hash: {$regex: ".*" + keyword + ".*", $options: 'i'}}]
                }, "", skip, limit, {});
            responseTransaction = [...fromTransaction, ...toTransaction]
        } else {
            Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction without keyword", "", "");

            let fromTransaction = await TransactionModel.getTransactionList(
                {from: address}, "", skip, limit, {[sortKey]: sortType}
            )
            let toTransaction = await TransactionModel.getTransactionList(
                {to: address}, "", skip, limit, {[sortKey]: sortType}
            )
            // return toTransaction;
            responseTransaction = [...fromTransaction, ...toTransaction]

            responseTransaction = responseTransaction.sort((transaction1, transaction2) => {
                if (sortType === 1)
                    return (transaction1[sortKey] - transaction2[sortKey])
                else
                    return (transaction2[sortKey] - transaction1[sortKey])
            })
        }
        return responseTransaction.slice(0, limit);
    }

    getFiltersForAddressTxn = async (requestData) => {
        const address = requestData.address.toLowerCase();
        const [fromTransaction, toTransaction] = await Promise.all([
            TransactionModel.getTransactionList({from: address}, '', 0, 1, {blockNumber: -1}),
            TransactionModel.getTransactionList({to: address}, '', 0, 1, {blockNumber: -1})]);
        if ((!fromTransaction || !fromTransaction.length) && (!toTransaction || !toTransaction.length))
            return {startDate: new Date().getTime()}
        else if (!fromTransaction || !fromTransaction.length)
            return {startDate: toTransaction[0].timestamp * 1000}
        else if (!toTransaction || !toTransaction.length)
            return {startDate: fromTransaction[0].timestamp * 1000}
        else return {startDate: fromTransaction[0].timestamp > toTransaction[0].timestamp ? toTransaction[0].timestamp * 1000 : fromTransaction[0].timestamp * 1000}
    };

    getFilteredTransactionsForAddress = async (requestData) => {
        if (!requestData) requestData = {}
        const address = requestData.address.toLowerCase()
        const txnType = requestData.txnType
        const startDate = requestData.startDate
        const endDate = requestData.endDate
        const sortKey = requestData.sortKey
        const sortType = requestData.sortType

        let responseTransactions

        const txnListRequest = this.parseGetTxnListRequest(requestData);
        delete txnListRequest.requestData.address
        delete txnListRequest.requestData.txnType
        delete txnListRequest.requestData.startDate
        delete txnListRequest.requestData.endDate
        if (startDate && endDate)
            txnListRequest.requestData.timestamp = {$gte: startDate / 1000, $lte: endDate / 1000}
        const [fromTransaction, toTransaction] = await Promise.all([TransactionModel.getTransactionList({
            ...txnListRequest.requestData, from: address
        }, txnListRequest.selectionKeys, txnListRequest.skip, txnListRequest.limit, txnListRequest.sorting), TransactionModel.getTransactionList({
            ...txnListRequest.requestData, to: address
        }, txnListRequest.selectionKeys, txnListRequest.skip, txnListRequest.limit, txnListRequest.sorting)]);

        if (txnType)
            return txnType === 'IN' ? toTransaction : fromTransaction;

        responseTransactions = [...fromTransaction, ...toTransaction]
        // try{
        //  // this.syncTransactionsFromCoinMarketAPI(address);}
        // catch(err){
        //     console.log("syncTransactionsFromCoinMarketAPI catch",err);
        // }

        responseTransactions.sort((transaction1, transaction2) => {
            if (sortType === 1)
                return (transaction1[sortKey] - transaction2[sortKey])
            else
                return (transaction2[sortKey] - transaction1[sortKey])
        })

        return responseTransactions.slice(0, txnListRequest.limit)
    };


    syncTransactionsFromCoinMarketAPI=async(address)=>{
        const [fromCount, toCount] = await Promise.all([
            TransactionModel.countDocuments({ from: address}),
            TransactionModel.countDocuments({to: address})]);

        let totalTransactions=fromCount+toCount;
        let URL="https://xdc.blocksscan.io/api/txs/listByAccount/"+address+"?page=1&limit=100&tx_type=all";
        const response = JSON.parse(await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL, "", {}, {}));
        let totalTransactionsFromBlockScan=response.total;
        let totalPages=response.pages;
        if(totalTransactions >= totalTransactionsFromBlockScan)
            return;
        await this.syncTransactionsBasedOnPage(address,totalPages);
    }

    syncTransactionsBasedOnPage=async(address,pages)=>{
        for(let index=1;index<=pages;index++){
            let URL="https://xdc.blocksscan.io/api/txs/listByAccount/"+address+"?page="+index+"&limit=100&tx_type=all";
            const response = JSON.parse(await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL, "", {}, {}));
           let queueData=response.items && response.items.map((transaction)=>{
               return this.parseTransaction(transaction);
           })
            let rabbitMqController = new RabbitMqController();
            await rabbitMqController.insertInQueue(Config.SYNC_TRANSACTION_EXCHANGE, Config.SYNC_TRANSACTION_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(queueData));
        }
    }

    parseTransaction(txDetail){
        const tx={
            blockHash: txDetail.blockHash || "",
            blockNumber: txDetail.blockNumber || 0,
            hash: txDetail.hash.toLowerCase() || "",
            from: txDetail.from.toLowerCase() || "",
            to: txDetail.to || "",
            gas: txDetail.gas || "",
            gasPrice: String(txDetail.gasPrice) || "",
            gasUsed: txDetail.gasUsed || 0,
            input: txDetail.input || "",
            nonce: txDetail.nonce || 0,
            transactionIndex: txDetail.transactionIndex || 0,
            value: txDetail.value || "",
            cumulativeGasUsed: txDetail.cumulativeGasUsed || 0,
            status: txDetail.status || false,
            timestamp: (moment(txDetail.timestamp).valueOf()/1000) || 0,
            modifiedOn: Date.now(),
            createdOn: Date.now(),
            isDeleted: false,
            isActive: true,
        }
        return tx;
    }


    getLatestTransactions = async (req) => {
        Utils.lhtLog("BLManager:getLatestTransactions", "get getLatestTransactions count " + req, "", "");
        let skip = parseInt(req.skip ? req.skip : 0);
        let limit = parseInt(req.limit ? req.limit : 10);
        let sortKey = parseInt(req.sortKey ? req.sortKey : -1);
        return await TransactionModel.getTransactionList({value: {$gte: 0}}, {}, skip, limit, {blockNumber: Number(sortKey)});

    }
    getTotalTransactions = async () => {
        Utils.lhtLog("BLManager:getTotalTransactions", "get getTotalTransactions count ", "", "");
        return await TransactionModel.countData({});
    }

    getTransactionsCountForAddress = async (requestData) => {
        if (!requestData) requestData = {}
        const address = requestData.address.toLowerCase()
        const txnType = requestData.txnType
        const startDate = requestData.startDate
        const endDate = requestData.endDate
        if (requestData.searchValue)
            requestData.searchKeys = ["hash", "from", "to","blockNumber"]

        const txnListRequest = this.parseGetTxnListRequest(requestData);
        delete txnListRequest.requestData.address
        delete txnListRequest.requestData.txnType
        delete txnListRequest.requestData.startDate
        delete txnListRequest.requestData.endDate

        if (startDate && endDate)
            txnListRequest.requestData.timestamp = {$gte: startDate / 1000, $lte: endDate / 1000}
        const [fromCount, toCount] = await Promise.all([
            TransactionModel.countDocuments({...txnListRequest.requestData, from: address}),
            TransactionModel.countDocuments({...txnListRequest.requestData, to: address})]);
        if (txnType)
            return txnType === 'IN' ? toCount : fromCount
        return (fromCount || 0) + (toCount || 0);
    }

    getAddressStats = async (addressHash) => {
        addressHash = addressHash.toLowerCase();
        Utils.lhtLog("BLManager:getAddressStats", "getAddressStats started", "", "");
        let addressStatsResponse = await AddressStatsModel.getAccount({address: addressHash});
        Utils.lhtLog("BLManager:getAddressStats", "addressStatsResponse", addressStatsResponse, "");
        let transactionTimestamp = await this.getAddressLastTransaction(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "addressLastTransactionTimestamp ", transactionTimestamp, "");
        if (Number(addressStatsResponse && addressStatsResponse.lastTransactionTimestamp) === Number(transactionTimestamp)) {
            return addressStatsResponse;
        }

        let fromAndToTransactions = await this.getAddressTransactionsCountStats(addressHash);

        if (fromAndToTransactions.totalTransaction > Config.ADDRESS_STATS_TRANSACTION_COUNT) {
            this.addressStatsDetails(addressHash, transactionTimestamp, fromAndToTransactions);
            return "Address Stats Details calculation in process";
        }
        if (!addressStatsResponse) {
            return await this.addressStatsDetails(addressHash, transactionTimestamp, fromAndToTransactions);
        }
        return await this.addressStatsDetails(addressHash, transactionTimestamp, fromAndToTransactions);
    }

    async addressStatsDetails(addressHash, lastTransactionTimestamp, fromAndToTransactions) {
        let addressDetails = await AddressModel.getAccount({address: addressHash});

        Utils.lhtLog("BLManager:getAddressStats", "transactionCount started", fromAndToTransactions, "");
        let getAddressTokenStats = await this.getAddressTokenStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "getAddressTokenStats", getAddressTokenStats, "");
        let toStats = await this.getAddressToStats(addressHash);
        let fromStats = await this.getAddressFromStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "getAddressToStats ", toStats && toStats.length > 0 && toStats[0].avgTransactions.length, "");
        Utils.lhtLog("BLManager:getAddressStats", "getAddressFromStats ", fromStats && fromStats.length > 0 && fromStats[0].avgTransactions.length, "");

        let totalAverage = [...(toStats && toStats.length > 0 && toStats[0].avgTransactions ? toStats[0].avgTransactions : []), ...(fromStats && fromStats.length > 0 && fromStats[0].avgTransactions ? fromStats[0].avgTransactions : [])]
        totalAverage.sort((a, b) => a.timestamp > b.timestamp ? -1 : 1);
        let highestAndAvgBalance = this.calculateBalance(totalAverage, addressDetails.balance)
        let gasFee = (toStats && toStats.length > 0 && toStats[0].gasFee && toStats[0].gasFee) + (fromStats && fromStats.length > 0 && fromStats[0].gasFee && fromStats[0].gasFee);

        let reqObj = {
            address: addressHash,
            accountType: addressDetails && addressDetails.accountType ? addressDetails.accountType : "",
            balance: addressDetails && addressDetails.balance ? addressDetails.balance : 0,
            timestamp: addressDetails && addressDetails.timestamp ? addressDetails.timestamp : 0,
            avgBalance: highestAndAvgBalance.avgBalance,
            gasFee: gasFee,
            totalTransactionsCount: fromAndToTransactions.totalTransaction,
            fromTransactionsCount: fromAndToTransactions.fromCount,
            toTransactionsCount: fromAndToTransactions.toCount,
            tokens: [getAddressTokenStats],
            highestTransaction: highestAndAvgBalance.highestTransaction,
            lastTransactionTimestamp: lastTransactionTimestamp,
            createdOn: Date.now(),
            modifiedOn: Date.now(),
            isDeleted: false,
            isActive: true
        }
        await AddressStatsModel.updateAccount({address: addressHash}, reqObj);
        return reqObj;
    }

    calculateBalance(totalAverage, currentBalance) {
        if (totalAverage.length <= 0)
            return {};
        let avgBalance = [];
        let highest = Number(totalAverage[0].amount);
        totalAverage.map((avg) => {
            highest = highest > Number(avg.amount) ? highest : Number(avg.amount);
            if (avg.action === "to")
                currentBalance = currentBalance - Number(avg.amount);
            else
                currentBalance = currentBalance + Number(avg.amount);
            avgBalance.push(currentBalance)
        })
        let sum = avgBalance.reduce((a, b) => (a) + (b), 0);
        return {
            avgBalance: Math.abs(sum) / avgBalance.length,
            highestTransaction: highest
        }

    }

    async getAddressLastTransaction(addressHash) {
        if (!addressHash)
            return {};
        let fromDetails = await TransactionModel.getTransactionList({from: addressHash}, {
            timestamp: 1,
            blockNumber: 1
        }, 0, 1, {blockNumber: -1});
        let toDetails = await TransactionModel.getTransactionList({to: addressHash}, {
            timestamp: 1,
            blockNumber: 1
        }, 0, 1, {blockNumber: -1});
        let fromTimestamp = fromDetails && fromDetails.length > 0 ? fromDetails[0].timestamp : 0;
        let toTimestamp = toDetails && toDetails.length > 0 ? toDetails[0].timestamp : 0;
        return fromTimestamp > toTimestamp ? fromTimestamp : toTimestamp;
    }


    async getAddressToStats(address) {
        if (!address)
            return {};
        return TransactionModel.aggregate(
            [
                {
                    $match: {
                        to: address
                    }
                },
                {
                    $group: {
                        _id: null,
                        gasFee: {$sum: "$gasUsed"},
                        avgTransactions: {$push: {"amount": "$value", "action": "to", "timestamp": "$timestamp"}}
                    }
                }
            ]
        );
    }

    async getAddressFromStats(address) {
        if (!address)
            return {};
        return TransactionModel.aggregate(
            [
                {
                    $match: {
                        from: address
                    }
                },
                {
                    $group: {
                        _id: null,
                        gasFee: {$sum: "$gasUsed"},
                        avgTransactions: {$push: {"amount": "$value", "action": "from", "timestamp": "$timestamp"}}
                    }
                }
            ]
        );
    }


    async getAddressTokenStats(address) {
        if (!address)
            return {};
        return TokenHolderModel.find({address: address}).count();
    }

    async getAddressTransactionsCountStats(address) {
        if (!address)
            return {};
        let toTransactionCount = await TransactionModel.countData({to: address})
        let fromTransactionCount = await TransactionModel.countData({from: address})
        return {
            fromCount: fromTransactionCount,
            toCount: toTransactionCount,
            totalTransaction: fromTransactionCount + toTransactionCount
        }
    }

    async getAddressTransactionsHighestValueStats(address) {
        if (!address)
            return {};
        return await TransactionModel.getTransactionList({$or: [{from: address}, {to: address}]}, {value: 1}, 0, 1, {value: -1});
    }

    async getAddressAverageBalanceStats(address) {
        if (!address)
            return {};
        return TransactionModel.aggregate(
            [
                {
                    $match: {
                        from: address
                    }
                }, {
                $group: {
                    _id: "$from",
                    avgBalance: {$avg: "$value"}
                }
            }
            ]
        );
    }

    getSomeDaysTransactions = async (params) => {
        let selectionKey = {day: 1, transactionCount: 1, avgGasPrice: 1, timestamp: 1}
        Utils.lhtLog("BLManager:getTotalTransactions", "get getSomeDaysTransactions  count", "", "");
        return await TransactionHistoryModel.getHistoricalDataList({}, selectionKey, 0, parseInt(params.days), {timestamp: -1});
    }

    getTransactionDetailsUsingHash = async (params) => {
        let hash = params.hash.toLowerCase();
        const transaction = await TransactionModel.getTransaction({hash: hash});
        if (!transaction)
            throw {message: apiFailureMessage.NO_TRANSACTION}
        return transaction;

    }

    parseGetTxnListRequest = (requestObj) => {
        if (!requestObj) return {};
        let skip = 0;
        if (requestObj.skip || requestObj.skip === 0) {
            skip = requestObj.skip;
            delete requestObj.skip
        }
        let limit = 10;
        if (requestObj.limit) {
            limit = requestObj.limit;
            delete requestObj.limit
        }
        let sorting = '';
        if (requestObj.sortKey) {
            sorting = {[requestObj.sortKey]: requestObj.sortType || -1};
            delete requestObj.sortKey;
            delete requestObj.sortType;
        }
        let selectionKeys = '';
        if (requestObj.selectionKeys) {
            selectionKeys = requestObj.selectionKeys;
            delete requestObj.selectionKeys
        }
        let searchQuery = [];
        if (requestObj.searchKeys && requestObj.searchValue && Array.isArray(requestObj.searchKeys) && requestObj.searchKeys.length) {
            requestObj.searchKeys.map((searchKey) => {
                let searchRegex = {"$regex": requestObj.searchValue, "$options": "i"}
                if(searchKey==="blockNumber" &&  !isNaN(Number(requestObj.searchValue))){
                    searchRegex = Number(requestObj.searchValue)  
                }
                searchQuery.push({[searchKey]: searchRegex});
            });
            requestObj["$or"] = searchQuery;
        }
        if (requestObj.searchKeys)
            delete requestObj.searchKeys;
        if (requestObj.searchValue)
            delete requestObj.searchValue;
        return {requestData: requestObj, skip, limit, sorting, selectionKeys};
    }
}
