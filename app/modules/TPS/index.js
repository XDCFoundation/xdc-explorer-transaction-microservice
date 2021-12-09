import Utils from '../../utils'
import { apiSuccessMessage, httpConstants } from '../../common/constants'
import BLManager from './manger'

export default class Index {
 
  async getCurrentTPS (request , response) {
    Utils.lhtLog('Inside getCurrentTPS', request, 'getCurrentTPS', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getCurrentTPS(request))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }

  async getMaxTPS (request , response) {
    Utils.lhtLog('Inside getCurrentTPS', request, 'getCurrentTPS', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getMaxTPS(request))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  
}
