import Utils from '../../utils'
import CoinMasterModel from "../../models/coinMaster";
import { executeHTTPRequest }  from "../../service/http-service";
import { httpConstants } from '../../common/constants';
import Config from '../../../config';

export default class Manger {
  
    getCoinMarketCap = async(params)=>{
        Utils.lhtLog("BLManager:getCoinMarketCap", "get list of getCoinMarketCap", "", "");      
        return await CoinMasterModel.getCoinMarketCapList({
            "fiatValue": params.fiatValue
        }, "", 0, 2, { _id:-1 });
       
    }

    getCoinMarketTotalSupply= async()=>{
        Utils.lhtLog("BLManager:getCoinMarketTotalSupply", "get  getCoinMarketTotalSupply ", "", "");
        let coinMarketResponse = await CoinMarketCapModel.getCoinMarketCapList({}, 
            {}, 0, 1, { lastUpdated: -1 });           
        let totalSupply = coinMarketResponse[0].totalSupply
        return totalSupply;  
      }

    getCoinMarketExchangeForToken= async(requestData)=>{
        Utils.lhtLog("BLManager:getCoinMarketExchangeForToken", "get  getCoinMarketExchangeForToken ", "", "");
        let symbol = requestData.symbol.toUpperCase()
        const URL = `${Config.COIN_MARKET_API_URL}?symbol=${symbol}&CMC_PRO_API_KEY=${Config.CMC_API_KEY}`;
        const responseUSD = await executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL , {} , {});
       
        if (responseUSD.status.error_message !== null || responseUSD.status.error_message === 400)
            return { requestData: {}, message: responseUSD.status.error_message, sucess: false, responseCode: responseUSD.status.error_code }

        const responseINR = await executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL + "&convert=INR", {}, {});

        if (responseINR.status.error_message !== null || responseINR.status.error_message === 400)
        return { requestData: {}, message: responseINR.status.error_message, sucess: false, responseCode: responseINR.status.error_code }

        const responseEUR = await executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL + "&convert=EUR", {}, {});

        if (responseEUR.status.error_message !== null || responseEUR.status.error_message === 400)
        return { requestData: {}, message: responseEUR.status.error_message, sucess: false, responseCode: responseEUR.status.error_code }
 
        let fullyDilutedMarketCapUSD = await this.getFullyDilutedMarketCap(responseUSD, "USD", symbol);
        
        let fullyDilutedMarketCapINR = await this.getFullyDilutedMarketCap(responseINR, "INR", symbol);
        let fullyDilutedMarketCapEUR = await this.getFullyDilutedMarketCap(responseEUR, "EUR", symbol);

        const internal_objUSD = responseUSD.data;
        
        let parseDataUSD = {
            marketCap: internal_objUSD[symbol].quote.USD.market_cap,
            totalSupply: internal_objUSD[symbol].total_supply,
            circulatingSupply: internal_objUSD[symbol].circulating_supply,
            fullyDilutedMarketCap: fullyDilutedMarketCapUSD,
            volume24_hr: internal_objUSD[symbol].quote.USD.volume_24h,
            tokenPrice: internal_objUSD[symbol].quote.USD.price,
            pricePercentageChange24_hr: internal_objUSD[symbol].quote.USD.percent_change_24h
        }
        
        const internal_objINR = responseINR.data;
        let parseDataINR = {
            marketCap: internal_objINR[symbol].quote.INR.market_cap,
            totalSupply: internal_objINR[symbol].total_supply,
            circulatingSupply: internal_objINR[symbol].circulating_supply,
            fullyDilutedMarketCap: fullyDilutedMarketCapINR,
            volume24_hr: internal_objINR[symbol].quote.INR.volume_24h,
            tokenPrice: internal_objINR[symbol].quote.INR.price,
            pricePercentageChange24_hr: internal_objINR[symbol].quote.INR.percent_change_24h
        }

        const internal_objEUR = responseEUR.data;
        let parseDataEUR = {
            marketCap: internal_objEUR[symbol].quote.EUR.market_cap,
            totalSupply: internal_objEUR[symbol].total_supply,
            circulatingSupply: internal_objEUR[symbol].circulating_supply,
            fullyDilutedMarketCap: fullyDilutedMarketCapEUR,
            volume24_hr: internal_objEUR[symbol].quote.EUR.volume_24h,
            tokenPrice: internal_objEUR[symbol].quote.EUR.price,
            pricePercentageChange24_hr: internal_objEUR[symbol].quote.EUR.percent_change_24h
        }

        return { symbol: symbol, parseDataUSD, parseDataINR, parseDataEUR }
        
    }

    async getFullyDilutedMarketCap(response, fiat, symbol) {
        if (!response || !fiat || !response.data)
            return;

        const internal_obj = response.data;

        if (fiat === "USD") { 
            if (internal_obj[symbol].max_supply === null) {  
                return internal_obj[symbol].quote.USD.price * internal_obj[symbol].total_supply;
            } else {
                return internal_obj[symbol].quote.USD.price * internal_obj[symbol].max_supply;
            }
        }

        if (fiat === "EUR") {
            if (internal_obj[symbol].max_supply === null) {
                return internal_obj[symbol].quote.EUR.price * internal_obj[symbol].total_supply;
            } else {
                return internal_obj[symbol].quote.EUR.price * internal_obj[symbol].max_supply;
            }
        }
        if (fiat === "INR") {
            if (internal_obj[symbol].max_supply === null) {
                return internal_obj[symbol].quote.INR.price * internal_obj[symbol].total_supply;
            } else {
                return internal_obj[symbol].quote.INR.price * internal_obj[symbol].max_supply;
            }
        }
    }
      
}
