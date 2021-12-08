import Utils from '../../utils'
import { apiSuccessMessage, httpConstants } from '../../common/constants'
import BLManager from './manger'

export default class Index {
 
  async getListOfTransferTransactionsForToken (request , response) {
    Utils.lhtLog('Inside getListOfTransferTransactionsForToken', request.params, 'getListOfTransferTransactionsForToken', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getListOfTransferTransactionsForToken(request.params, request.query))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  
  async getTotalTransferTransactionForToken (request , response) {
    Utils.lhtLog('Inside getListOfTransferTransactionsForToken', request.params, 'getListOfTransferTransactionsForToken', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getTotalTransferTransactionForToken(request.params))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
}
