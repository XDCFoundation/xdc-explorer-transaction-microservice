import Utils from '../../utils'
import TransferModel from "../../models/transfer";
import TransactionModel from "../../models/transaction";
import ContractModel from "../../models/contract";

export default class Manger {
  
    getListOfTransferTransactionsForToken = async(pathParameters,queryStringParameters)=>{
        Utils.lhtLog("BLManager:getListOfTransferTransactionsForToken", "get list of TokenTransfer", "", "");
      
        let skip = 0
        let limit = 0
        let contractAddress=pathParameters.contractAddress.toLowerCase();
        if (queryStringParameters && queryStringParameters.skip) {
            skip = queryStringParameters.skip
        }

        if (queryStringParameters && queryStringParameters.limit) {
            limit = queryStringParameters.limit
        }
        return await TransferModel.getTokenList({contract: contractAddress}, {}, parseInt(skip), parseInt(limit), { timestamp: -1 });
       
    }

    getTotalTransferTransactionForToken= async(pathParameters)=>{
        Utils.lhtLog("BLManager:getTotalTransferTransactionForToken", "get total of TokenTransfer count", "", "");
        let contractAddress=pathParameters.contractAddress.toLowerCase();
        return await TransferModel.countData({contract:contractAddress});
    }

    getTransferTransactionDetailsUsingHash= async(pathParameters)=>{
        Utils.lhtLog("BLManager:getTotalTransferTransactionForToken", "get total of TokenTransfer count", "", "");
        let transactionHash=pathParameters.hash.toLowerCase();
        let response={};
        let transferToken= await TransferModel.getToken( {hash:transactionHash});
        const transaction = await TransactionModel.getTransaction({hash: transactionHash});
        const contract = await ContractModel.getContractList({address: transferToken.contract},{decimals:1},0,1,"");
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
                nonce:0,
                gasUsed:0,
                gasPrice:0,
                gas:0,
                transactionValue:0,
                input:""
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
        }
        return response;
       
    }
    

}
