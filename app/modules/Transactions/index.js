import Utils from '../../utils'
import { apiSuccessMessage, httpConstants } from '../../common/constants'
import BLManager from './manger'

export default class Index {
  async getTransactionsForAddress (request, response) {
    Utils.lhtLog('Inside getTransactionsForAddress', request.params, 'getTransactionsForAddress', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getTransactionsForAddress(request.params, request.query))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }

  async getFiltersForAddressTxn(request, response) {
    Utils.lhtLog('Inside getFiltersForAddressTxn', request.params, 'getFiltersForAddressTxn', 0, '')
    const [error, txnListResponse] = await Utils.parseResponse(new BLManager().getFiltersForAddressTxn({...request.params}))
    if (!txnListResponse) {
      return Utils.handleError(error, request, response)
    }
    return Utils.response(response, txnListResponse, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getFilteredTransactionsForAddress(request, response) {
    Utils.lhtLog('Inside getFilteredTransactionsForAddress', request.params, 'getFilteredTransactionsForAddress', 0, '')
    const [error, txnListResponse] = await Utils.parseResponse(new BLManager().getFilteredTransactionsForAddress({...request.params, ...request.body}))
    if (!txnListResponse) {
      return Utils.handleError(error, request, response)
    }
    return Utils.response(response, txnListResponse, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getLatestTransactions (request , response) {
    Utils.lhtLog('Inside getLatestTransactions', request.query, 'getLatestTransactions', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getLatestTransactions( request.query))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getTotalTransactions (request , response) {
    Utils.lhtLog('Inside getTotalTransactions', request.params, 'getTotalTransactions', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getTotalTransactions())
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getNetworkDetails (request , response) {
    Utils.lhtLog('Inside getNetworkDetails', request.params, 'getNetworkDetails', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getNetworkDetails())
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getTransactionsCountForAddress (request , response) {
    Utils.lhtLog('Inside getTransactionsCountForAddress', request.params, 'getTransactionsCountForAddress', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getTransactionsCountForAddress({...request.params, ...request.query}))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getSomeDaysTransactions (request , response) {
    Utils.lhtLog('Inside getSomeDaysTransactions', request.params, 'getSomeDaysTransactions', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getSomeDaysTransactions(request.params))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)

  }
  async getTransactionDetailsUsingHash (request , response) {
    Utils.lhtLog('Inside getTransactionDetails', request.params, 'getTransactionDetails', 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getTransactionDetailsUsingHash(request.params))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
  async getAddressStats (request , response) {
    Utils.lhtLog('Inside getAddressStats', request.params, request.params.address, 0, '')
    const [error, getMetersRes] = await Utils.parseResponse(new BLManager().getAddressStats(request.params.address))
    if (!getMetersRes) { return Utils.handleError(error, request, response) }
    return Utils.response(response, getMetersRes, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK)
  }
}
