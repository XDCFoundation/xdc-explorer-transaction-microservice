import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import TransactionHistoryModel from "../../models/historical";
import {apiFailureMessage} from '../../common/constants';
import AddressModel from "../../models/account";
import AddressStatsModel from "../../models/addressStats";
import TokenTransferModel from "../../models/transfer";

export default class Manger {
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
        const address = requestData.address
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
        const address = requestData.address
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
        responseTransactions.sort((transaction1, transaction2) => {
            if (sortType === 1)
                return (transaction1[sortKey] - transaction2[sortKey])
            else
                return (transaction2[sortKey] - transaction1[sortKey])
        })

        return responseTransactions.slice(0, txnListRequest.limit)
    };


    getLatestTransactions = async (req) => {
        Utils.lhtLog("BLManager:getLatestTransactions", "get getLatestTransactions count " + req, "", "");
        let skip = parseInt(req.skip ? req.skip : 0);
        let limit = parseInt(req.limit ? req.limit : 10);
        return await TransactionModel.getTransactionList({value: {$gt: 0}}, {}, skip, limit, {blockNumber: -1});

    }
    getTotalTransactions = async () => {
        Utils.lhtLog("BLManager:getTotalTransactions", "get getTotalTransactions count ", "", "");
        return await TransactionModel.countData({});
    }

    getTransactionsCountForAddress = async (requestData) => {
        if (!requestData) requestData = {}
        const address = requestData.address
        const txnType = requestData.txnType
        const startDate = requestData.startDate
        const endDate = requestData.endDate

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
        addressHash=addressHash.toLowerCase();
        Utils.lhtLog("BLManager:getAddressStats", "getAddressStats started", "", "");
        let addressStatsResponse = await AddressStatsModel.getAccount({address: addressHash});
        Utils.lhtLog("BLManager:getAddressStats", "addressStatsResponse", addressStatsResponse, "");
        let transactionTimestamp = await this.getAddressLastTransaction(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "addressLastTransactionTimestamp ", transactionTimestamp, "");
        if (!addressStatsResponse) {
            return await this.addressStatsDetails(addressHash, transactionTimestamp);
        }
        if (Number(addressStatsResponse.lastTransactionTimestamp) === Number(transactionTimestamp)) {
            return addressStatsResponse;
        }
        return await this.addressStatsDetails(addressHash, transactionTimestamp);
    }

    async addressStatsDetails(addressHash, lastTransactionTimestamp) {
        let addressDetails = await AddressModel.getAccount({address: addressHash});
        Utils.lhtLog("BLManager:getAddressStats", "transactionCount started", "", "");
        let getAddressTokenStats = await this.getAddressTokenStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "averageBalance started", getAddressTokenStats, "");
        let stats = await this.getAddressAllStats(addressHash);
        let toMaxTransaction=stats && stats.length > 0 ? Number(stats[0].toMaxTransactionValue):0;
        let fromMaxTransaction=stats && stats.length > 0 ? Number(stats[0].fromMaxTransactionValue):0;
        let highestTransaction =  toMaxTransaction> fromMaxTransaction? toMaxTransaction : fromMaxTransaction;
        let totalTransactionsCount = stats && stats.length > 0 ? stats[0].fromTransaction + stats[0].toTransaction : 0;
        Utils.lhtLog("BLManager:getAddressStats", "averageBalance started", getAddressTokenStats, "");
        let reqObj = {
            address: addressHash,
            accountType:addressDetails && addressDetails.accountType ? addressDetails.accountType:"",
            balance: addressDetails && addressDetails.balance ?addressDetails.balance :0 ,
            timestamp: addressDetails && addressDetails.timestamp ?addressDetails.timestamp:0,
            avgBalance: totalTransactionsCount > 0 ? highestTransaction / totalTransactionsCount : highestTransaction,
            gasFee: stats && stats.length > 0 ? stats[0].toGasFee + stats[0].fromGasFee : 0,
            totalTransactionsCount: totalTransactionsCount,
            fromTransactionsCount: stats && stats.length > 0 ? stats[0].fromTransaction : 0,
            toTransactionsCount: stats && stats.length > 0 ? stats[0].toTransaction : 0,
            tokens: getAddressTokenStats && getAddressTokenStats.length > 0 ? [getAddressTokenStats[0].uniqueTokenCount] : [],
            highestTransaction: highestTransaction,
            lastTransactionTimestamp: lastTransactionTimestamp,
            createdOn: Date.now(),
            modifiedOn: Date.now(),
            isDeleted: false,
            isActive: true
        }
        await AddressStatsModel.updateAccount({address: addressHash}, reqObj);
        return reqObj;
    }


    async getAddressLastTransaction(addressHash) {
        if (!addressHash)
            return {};
        let fromDetails = await TransactionModel.getTransactionList({from: addressHash}, {timestamp: 1,blockNumber:1}, 0, 1, {blockNumber: -1});
        let toDetails = await TransactionModel.getTransactionList({to: addressHash}, {timestamp: 1,blockNumber:1}, 0, 1, {blockNumber: -1});
        let fromTimestamp=fromDetails && fromDetails.length>0?fromDetails[0].timestamp:0;
        let toTimestamp=toDetails && toDetails.length>0?toDetails[0].timestamp:0;
        return fromTimestamp > toTimestamp ? fromTimestamp : toTimestamp;
    }


    async getAddressAllStats(address) {
        if (!address)
            return {};
        return TransactionModel.aggregate(
            [
                {
                    $match: {
                        $or: [{from: address}, {to: address}]
                    }
                },
                {
                    $group: {
                        _id: {
                            from: address
                        },
                        fromTransaction: {$sum: 1},
                        fromGasFee: {$sum: "$gasUsed"},
                        fromMaxTransactionValue: {$max: "$value"}
                    }
                },
                {
                    $group: {
                        _id: {
                            to: address
                        },
                        toTransaction: {$sum: 1},
                        toGasFee: {$sum: "$gasUsed"},
                        toMaxTransactionValue: {$max: "$value"},
                        fromTransaction: {$sum: "$fromTransaction"},
                        fromGasFee: {$sum: "$fromGasFee"},
                        fromMaxTransactionValue: {$max: "$fromMaxTransactionValue"}
                    }
                },
                {
                    $project: {
                        fromTransaction: 1,
                        fromGasFee: 1,
                        fromMaxTransactionValue: 1,
                        toTransaction: 1,
                        toGasFee: 1,
                        toMaxTransactionValue: 1
                    }
                }
            ],{

            }
        );
    }


    async getAddressTokenStats(address) {
        if (!address)
            return {};
        return TokenTransferModel.aggregate(
            [
                {
                    $match: {
                        $or: [{from: address}, {to: address}]
                    }
                }, {
                $group: {
                    _id: {
                        $or: [{from: address}, {to: address}]
                    },
                    uniqueCount: {$addToSet: "$contract"}
                }
            },
                {$project: {uniqueTokenCount: {$size: "$uniqueCount"}}}
            ]
        );
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
                let searchRegex = {"$regex": requestObj.searchValue, "$options": "i"};
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
