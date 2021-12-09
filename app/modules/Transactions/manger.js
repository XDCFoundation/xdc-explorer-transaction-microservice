import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import TransactionHistoryModel from "../../models/historical";
import { apiFailureMessage } from '../../common/constants';

export default class Manger {
    getTransactionsForAddress = async (pathParameter, queryStringParameter) => {

        Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "getAccountDetailsUsingAddress started", "", "");

        let skip = parseInt(0)
        let limit = parseInt(1)
        let address = pathParameter && pathParameter.address;
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
                    }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }]
                }, "", skip, limit, {});
            let fromTransaction = await TransactionModel.getTransactionList(
                {
                    $and: [{
                        from: address
                    }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }]
                }, "", skip, limit, {});
            responseTransaction = [...fromTransaction, ...toTransaction]
        }
        else {
            Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction without keyword", "", "");
            let fromTransaction = await TransactionModel.getTransactionList(
                { from: address }, "", skip, limit, {}
            )
            let toTransaction = await TransactionModel.getTransactionList(
                { to: address }, "", skip, limit, {}
            )
            responseTransaction = [...fromTransaction, ...toTransaction]

        }
        return responseTransaction;

    }

    getLatestTransactions = async (req) => {
        Utils.lhtLog("BLManager:getLatestTransactions", "get getLatestTransactions count " + req, "", "");
        let skip = parseInt(req.skip ? req.skip : 0);
        let limit = parseInt(req.limit ? req.limit : 10);
        return await TransactionModel.getTransactionList({}, {}, skip, limit, { blockNumber: -1 });
       
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
            toCount =Promise.resolve( TransactionModel.countData({
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
        }
        else {
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
        let selectionKey = { day: 1, transactionCount: 1, avgGasPrice: 1 }
        Utils.lhtLog("BLManager:getTotalTransactions", "get getSomeDaysTransactions  count", "", "");
        let response = await TransactionHistoryModel.getHistoricalDataList({}, selectionKey, 0, parseInt(params.days), { _id: -1 });
        return response
    }

    getTransactionDetailsUsingHash = async (params) => {
        const transaction = await TransactionModel.getTransaction({ hash: params.hash });
        if(!transaction)
            throw {message: apiFailureMessage.NO_TRANSACTION}


    }

}
