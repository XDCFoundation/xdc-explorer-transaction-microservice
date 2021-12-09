import Utils from '../../utils'
import { apiSuccessMessage, httpConstants } from '../../common/constants'
import BLManager from './manger'

export default class Index {
 
  async searchBlockchainData (request , response) {
    Utils.lhtLog('Inside getCoinMarketCap', request.body, 'getCoinMarketCap', 0, '')
    const [error, getRes] = await Utils.parseResponse(new BLManager().searchData(request.body))
    if (!getRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
}
