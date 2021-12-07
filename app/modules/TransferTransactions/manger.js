import Utils from '../../utils'
import TransferModel from "../../models/transfer";

export default class Manger {
  
    getListOfTransferTransactionsForToken = async(pathParameters,queryStringParameters)=>{
        Utils.lhtLog("BLManager:getListOfTransferTransactionsForToken", "get list of TokenTransfer", "", "");
      
        let skip = 0
        let limit = 0

        if (queryStringParameters && queryStringParameters.skip) {
            skip = queryStringParameters.skip
        }

        if (queryStringParameters && queryStringParameters.limit) {
            limit = queryStringParameters.limit
        }
        return await TransferModel.getTokenList({contract: pathParameters.address}, {}, parseInt(skip), parseInt(limit), { timestamp: -1 });
       
    }

    

}
