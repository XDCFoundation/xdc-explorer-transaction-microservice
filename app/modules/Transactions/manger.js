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
        let highestTransaction = stats && stats.length > 0 && Number(stats[0].toMaxTransactionValue) > Number(stats[0].fromMaxTransactionValue) ? Number(stats[0].toMaxTransactionValue) : Number(stats[0].fromMaxTransactionValue);
        let totalTransactionsCount = stats && stats.length > 0 ? stats[0].fromTransaction + stats[0].toTransaction : 0;
        Utils.lhtLog("BLManager:getAddressStats", "averageBalance started", getAddressTokenStats, "");
        let reqObj = {
            address: addressHash,
            accountType: addressDetails.accountType,
            balance: addressDetails.balance,
            timestamp: addressDetails.timestamp,
            avgBalance: totalTransactionsCount > 0 ? highestTransaction / totalTransactionsCount : highestTransaction,
            gasFee: stats && stats.length > 0 ? stats[0].toGasFee + stats[0].fromGasFee : 0,
            totalTransactionCount: totalTransactionsCount,
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
        let fromTimestmap = await TransactionModel.getTransactionList({from: addressHash}, {timestamp: 1}, 0, 1, {timestamp: -1});
        let toTimestamp = await TransactionModel.getTransactionList({to: addressHash}, {timestamp: 1}, 0, 1, {timestamp: -1});
        console.log("from to", fromTimestmap, toTimestamp);
        return fromTimestmap > toTimestamp ? fromTimestmap[0].timestamp : toTimestamp[0].timestamp;
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
            ]
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

}
