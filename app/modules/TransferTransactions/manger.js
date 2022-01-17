import Utils from '../../utils'
import TransferModel from "../../models/transfer";
import TransactionModel from "../../models/transaction";
import ContractModel from "../../models/contract";

export default class Manger {
    getTransferListRequest = (requestData) => {
        const contract = requestData.contractAddress.toLowerCase();
        const startDate = requestData.startDate;
        requestData.searchKeys = ['hash', 'from', 'to']
        requestData.contract = contract
        delete requestData.contractAddress;
        delete requestData.startDate;
        const txnListRequest = this.parseGetTxnListRequest(requestData);
        if (startDate)
            txnListRequest.requestData.timestamp = {$gte: startDate / 1000, $lte: new Date().getTime() / 1000}
        return txnListRequest
    }
    getListOfTransferTransactionsForToken = async (requestData) => {
        const txnListRequest = await this.getTransferListRequest(requestData);
        return TransferModel.getTokenList(txnListRequest.requestData, {}, parseInt(txnListRequest.skip), parseInt(txnListRequest.limit), txnListRequest.sorting ? txnListRequest.sorting : {timestamp: -1});
    }

    getTotalTransferTransactionForToken = async (requestData) => {
        const txnListRequest = await this.getTransferListRequest(requestData);
        return TransferModel.countDocuments(txnListRequest.requestData);
    }

    getTransferTransactionDetailsUsingHash= async(pathParameters)=>{
        Utils.lhtLog("BLManager:getTotalTransferTransactionForToken", "get total of TokenTransfer count", "", "");
        let transactionHash=pathParameters.hash.toLowerCase();
        let response={};
        let transferToken= await TransferModel.getToken( {hash:transactionHash});
        const transaction = await TransactionModel.getTransaction({hash: transactionHash});
        const contract = await ContractModel.getContractList({address: transferToken.contract},{decimals:1,symbol:1,tokenName:1,totalSupply:1},0,1,"");
        if (!transaction){
            response={
                hash:transferToken.hash,
                blockNumber: transferToken.blockNumber,
                method: transferToken.method,
                from: transferToken.from,
                to: transferToken.to,
                contract: transferToken.contract,
                value:transferToken.value,
                timestamp: transferToken.timestamp,
                decimals:contract&&contract[0]&&contract[0].decimals?contract[0].decimals:0,
                symbol:contract&&contract[0]&&contract[0].symbol?contract[0].symbol:"",
                tokenName:contract&&contract[0]&&contract[0].tokenName?contract[0].tokenName:"",
                totalSupply:contract&&contract[0]&&contract[0].totalSupply?contract[0].totalSupply:0,
                nonce:0,
                gasUsed:0,
                gasPrice:0,
                gas:0,
                transactionValue:0,
                input:"",
                status:false
            }
            return response;
        }

        response={
            hash:transferToken.hash,
            blockNumber: transferToken.blockNumber,
            method: transferToken.method,
            from: transferToken.from,
            to: transferToken.to,
            contract: transferToken.contract,
            value:transferToken.value,
            timestamp: transferToken.timestamp,
            nonce:transaction.nonce,
            gasUsed:transaction.gasUsed,
            gasPrice:transaction.gasPrice,
            gas:transaction.gas,
            transactionValue:transaction.value,
            input:transaction.input,
            decimals:contract&&contract[0]&&contract[0].decimals?contract[0].decimals:0,
            symbol:contract&&contract[0]&&contract[0].symbol?contract[0].symbol:"",
            tokenName:contract&&contract[0]&&contract[0].tokenName?contract[0].tokenName:"",
            totalSupply:contract&&contract[0]&&contract[0].totalSupply?contract[0].totalSupply:0,
            status:transaction.status
        }
        return response;

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
