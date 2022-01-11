import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import TransactionHistoryModel from "../../models/historical";
import AddressModel from "../../models/account";
import {apiFailureMessage} from '../../common/constants';
import AddressStatsModel from "../../models/addressStats";

export default class Manger {
    getTransactionsForAddress = async (pathParameter, queryStringParameter) => {

        Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "getAccountDetailsUsingAddress started", "", "");

        let skip = parseInt(0)
        let limit = parseInt(1)
        let address = pathParameter && pathParameter.address.toLowerCase();
        if (queryStringParameter && queryStringParameter.skip)
            skip = parseInt(queryStringParameter.skip)

        if (queryStringParameter && queryStringParameter.limit)
            limit = parseInt(queryStringParameter.limit)
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
                {from: address}, "", skip, limit, {blockNumber:-1}
            )
            let toTransaction = await TransactionModel.getTransactionList(
                {to: address}, "", skip, limit, {blockNumber:-1}
            )
            // return toTransaction;
            responseTransaction = [...fromTransaction, ...toTransaction]

        }
        return responseTransaction;

    }

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

    getTransactionsCountForAddress = async (pathParameter, queryStringParameter) => {
        Utils.lhtLog("BLManager:getTransactionsCountForAddress", "getTransactionsCountForAddress started", "", "");
        let address = pathParameter && pathParameter.address;
        Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction count for address", "", "");
        let toCount = 0, fromCount = 0, totalCount = 0
        if (queryStringParameter && queryStringParameter.keyword != null && queryStringParameter.keyword != '') {
            let keyword = queryStringParameter.keyword
            toCount = Promise.resolve(TransactionModel.countData({
                $and: [{
                    to: address
                    // $or: [{ to: address },
                    // { from: address }]
                }, {hash: {$regex: ".*" + keyword + ".*", $options: 'i'}}
                ]
            }))
            fromCount = Promise.resolve(TransactionModel.countData({
                $and: [{
                    from: address
                    // $or: [{ to: address },
                    // { from: address }]
                }, {hash: {$regex: ".*" + keyword + ".*", $options: 'i'}}
                ]
            }))
        } else {
            Utils.lhtLog("BLManager:getTransactionsCountForAddress", "get total transaction count for address without keyword", "", "");


            fromCount = Promise.resolve(TransactionModel.countData({from: address}))
            toCount = Promise.resolve(TransactionModel.countData({to: address}))
        }
        await fromCount.then((data) => {
            totalCount += data
        })
        await toCount.then((data) => {
            totalCount += data
        })
        return totalCount;

    }

    getAddressStats = async (addressHash) => {
        Utils.lhtLog("BLManager:getAddressStats", "getAddressStats started", "", "");
        let addressStatsResponse = await AddressStatsModel.getAccount({address: addressHash});
        Utils.lhtLog("BLManager:getAddressStats", "addressStatsResponse", addressStatsResponse, "");
        let addressLastTransactionTimestamp = await this.getAddressLastTransaction(addressHash);
        let transactionTimestamp=addressLastTransactionTimestamp &&addressLastTransactionTimestamp.length>0&& addressLastTransactionTimestamp[0].timestamp?addressLastTransactionTimestamp[0].timestamp:0;
        Utils.lhtLog("BLManager:getAddressStats", "addressLastTransactionTimestamp "+transactionTimestamp, addressLastTransactionTimestamp, "");
        if (!addressStatsResponse) {
          return await this.AddressStatsDetails(addressHash,transactionTimestamp);
        }
        if (addressStatsResponse.timestamp === transactionTimestamp){
            return addressStatsResponse;}
        return await this.AddressStatsDetails(addressHash,transactionTimestamp);
    }

    async AddressStatsDetails(addressHash,lastTransactionTimestamp) {
        let addressDetails = await AddressModel.getAccount({address: addressHash});
        Utils.lhtLog("BLManager:getAddressStats", "transactionCount started", "", "");
        let transactionCount = await this.getAddressTransactionsCountStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "transactionHighestValue started", "", "");
        let transactionHighestValue = await this.getAddressTransactionsHighestValueStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "averageBalance started", "", "");
        let averageBalance = await this.getAddressAverageBalanceStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "gasUsed started", "", "");
        let gasUsed = await this.getAddressGasUsedStats(addressHash);
        Utils.lhtLog("BLManager:getAddressStats", "gasUsed end", "", "");
        console.log(addressDetails, transactionCount, transactionHighestValue, averageBalance, gasUsed);
        let reqObj = {
            address: addressHash,
            accountType: addressDetails.accountType,
            balance: addressDetails.balance,
            timestamp: addressDetails.timestamp,
            avgBalance: averageBalance && averageBalance.length>0&& averageBalance[0].avgBalance?averageBalance[0].avgBalance:0,
            gasFee: gasUsed && gasUsed.length>0 && gasUsed[0].gasFee?gasUsed[0].gasFee:0,
            totalTransactionsCount: transactionCount.totalTransaction,
            fromTransactionsCount: transactionCount.fromCount,
            toTransactionsCount: transactionCount.toCount,
            tokens: [],
            highestTransaction: transactionHighestValue && transactionHighestValue.length>0 && transactionHighestValue[0].value?transactionHighestValue[0].value:0,
            lastTransactionTimestamp: lastTransactionTimestamp,
            createdOn: Date.now(),
            modifiedOn: Date.now(),
            isDeleted: false,
            isActive: true
        }
        let addressStatsModel = new AddressStatsModel(reqObj);
        return await addressStatsModel.saveData();
    }


    async getAddressLastTransaction(addressHash) {
        if (!addressHash)
            return {};
        return TransactionModel.getTransactionList({$or: [{from: addressHash}, {to: addressHash}]}, {timestamp: 1}, 0, 1, {timestamp: -1});
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

    async getAddressGasUsedStats(address) {
        if (!address)
            return {};
        return TransactionModel.aggregate(
            [
                {
                    $match: {
                        $or: [{from: address}, {to: address}]
                    }
                }, {
                $group: {
                    _id: {
                        $or: {
                            $or: [{from: address}, {to: address}]
                        }
                    },
                    gasFee: {$sum: "$gasUsed"}
                }
            }
            ]
        );
    }


    async getAddressTokenStats(address) {
        if (!address)
            return {};
        return TransactionModel.aggregate(
            [
                {
                    $match: {
                        $or: [{from: address}, {to: address}]
                    }
                }, {
                $group: {
                    _id: "$contractAddress",
                    tokens: {$sum: 1}
                }
            }
            ]
        );
    }

    getSomeDaysTransactions = async (params) => {
        let selectionKey = {day: 1, transactionCount: 1, avgGasPrice: 1, timestamp:1}
        Utils.lhtLog("BLManager:getTotalTransactions", "get getSomeDaysTransactions  count", "", "");
        return await TransactionHistoryModel.getHistoricalDataList({}, selectionKey, 0, parseInt(params.days), {timestamp: -1});
    }

    getTransactionDetailsUsingHash = async (params) => {
        let hash=params.hash.toLowerCase();
        const transaction = await TransactionModel.getTransaction({hash: hash});
        if (!transaction)
            throw {message: apiFailureMessage.NO_TRANSACTION}
        return transaction;

    }

}
