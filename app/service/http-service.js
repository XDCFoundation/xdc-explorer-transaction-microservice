const request = require('request')

class HTTPService {
  /**
   * execute Http request
   */
  static async executeHTTPRequest (method, url, data, headers) {
    return await new Promise(function (fulfill, reject) {
      request({
        url: url,
        method: method,
        headers: headers,
        json: data
      }, function (error, response, body) {
        // console.log('body:-', body);
        if (error) {
          console.log('err' + error)
          reject(error)
        } else {
          fulfill(body)
        }
      })
    })
  }
}

module.exports = HTTPService
