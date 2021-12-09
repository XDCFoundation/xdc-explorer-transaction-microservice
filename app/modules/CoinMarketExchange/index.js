import Utils from '../../utils'
import { apiSuccessMessage, httpConstants } from '../../common/constants'
import BLManager from './manger'

export default class Index {
 
  async getCoinMarketCap (request , response) {
    Utils.lhtLog('Inside getCoinMarketCap', request.params, 'getCoinMarketCap', 0, '')
    const [error, getRes] = await Utils.parseResponse(new BLManager().getCoinMarketCap(request.params))
    if (!getRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  
  async getCoinMarketTotalSupply (request , response) {
    Utils.lhtLog('Inside getCoinMarketTotalSupply', {}, 'getCoinMarketTotalSupply', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getCoinMarketTotalSupply())
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }

  async getCoinMarketExchangeForToken (request , response) {
    Utils.lhtLog('Inside getCoinMarketExchangeForToken', request.params, 'getCoinMarketExchangeForToken', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getCoinMarketExchangeForToken(request.params))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
}
