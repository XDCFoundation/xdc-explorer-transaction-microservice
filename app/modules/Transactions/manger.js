import Utils from '../../utils'
import TransactionModel from "../../models/transaction"
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
                    responseTransaction = [...fromTransaction , ...toTransaction]           
        }
        else {
            Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction without keyword", "", "");
           let  fromTransaction = await TransactionModel.getTransactionList(
                {   from : address  } , "" , skip , limit , {}
            )
             let toTransaction =   await TransactionModel.getTransactionList(
                {   to:  address  } , "" , skip , limit , {}
            )
            responseTransaction = [...fromTransaction , ...toTransaction]
           
        }
        return responseTransaction;

    }

    getLatestTransactions = async(req) => {
        Utils.lhtLog("BLManager:getLatestTransactions", "get getLatestTransactions count " + req, "", "");
        let skip = parseInt(req.skip ? req.skip : 0);
        let limit = parseInt(req.limit ? req.limit : 10);

        let response = await TransactionModel.getTransactionList({}, {}, skip, limit, { blockNumber: -1 });
        let responseArr = [];
        for (let index = 0; index < limit; index++) {
            let gasPrice = Number(response[index].gasPrice)
            let gasUsed = response[index].gasUsed

            let transactionFee = gasPrice * gasUsed

            let newResponse = { ...response[index].toJSON(), transactionFee: transactionFee }


            responseArr.push(newResponse)
        }
        return responseArr
    }
    getTotalTransactions = async() => {
        Utils.lhtLog("BLManager:getTotalTransactions", "get getTotalTransactions count " , "", "");
        return await TransactionModel.countData({});
    }

    getTransactionsCountForAddress =async(pathParameter, queryStringParameter) =>{
        Utils.lhtLog("BLManager:getTransactionsCountForAddress", "getTransactionsCountForAddress started", "", "");
        let address = pathParameter && pathParameter.address;
        Utils.lhtLog("BLManager:getAccountDetailsUsingAddress", "get total transaction count for address", "", "");
        if (queryStringParameter && queryStringParameter.keyword != null && queryStringParameter.keyword != '') {
            let keyword = queryStringParameter.keyword    
          return await TransactionModel.countData({
                $and: [{
                    $or: [{ to: address },
                    { from: address }]
                }, { hash: { $regex: ".*" + keyword + ".*", $options: 'i' } }
                ]
            })
        }
        else {
            Utils.lhtLog("BLManager:getTransactionsCountForAddress", "get total transaction count for address without keyword", "", "");
           return await TransactionModel.countData({ $or: [{ from: { $eq: address } }, { to: { $eq: address } }] })
        }
    }


}
