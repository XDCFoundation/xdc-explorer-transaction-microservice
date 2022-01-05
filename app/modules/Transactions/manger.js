import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import TransactionHistoryModel from "../../models/historical";
import { apiFailureMessage } from '../../common/constants';

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
                    }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }]
                }, "", skip, limit, {});
            let fromTransaction = await TransactionModel.getTransactionList(
                {
                    $and: [{
                        from: address
                    }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }]
                }, "", skip, limit, {});
            responseTransaction = [...fromTransaction, ...toTransaction]
        } else {
            Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction without keyword", "", "");

            let fromTransaction = await TransactionModel.getTransactionList(
                { from: address }, "", skip, limit, { [sortKey]: sortType }
            )
            let toTransaction = await TransactionModel.getTransactionList(
                { to: address }, "", skip, limit, { [sortKey]: sortType }
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
        return responseTransaction.slice(limit);
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
                }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }
                ]
            }))
            fromCount = Promise.resolve(TransactionModel.countData({
                $and: [{
                    from: address
                    // $or: [{ to: address },
                    // { from: address }]
                }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }
                ]
            }))
        } else {
            Utils.lhtLog("BLManager:getTransactionsCountForAddress", "get total transaction count for address without keyword", "", "");


            fromCount = Promise.resolve(TransactionModel.countData({ from: address }))
            toCount = Promise.resolve(TransactionModel.countData({ to: address }))
        }
        await fromCount.then((data) => {
            totalCount += data
        })
        await toCount.then((data) => {
            totalCount += data
        })
        return totalCount;

    }

    getSomeDaysTransactions = async (params) => {
        let selectionKey = { day: 1, transactionCount: 1, avgGasPrice: 1, timestamp: 1 }
        Utils.lhtLog("BLManager:getTotalTransactions", "get getSomeDaysTransactions  count", "", "");
        return await TransactionHistoryModel.getHistoricalDataList({}, selectionKey, 0, parseInt(params.days), { timestamp: -1 });
    }

    getTransactionDetailsUsingHash = async (params) => {
        let hash = params.hash.toLowerCase();
        const transaction = await TransactionModel.getTransaction({ hash: hash });
        if (!transaction)
            throw { message: apiFailureMessage.NO_TRANSACTION }
        return transaction;

    }

}
