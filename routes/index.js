/**
 * Created by AyushK on 18/09/20.
 */
import * as ValidationManger from "../middleware/validation";
import Transactions from "../app/modules/Transactions";
import TransferTransactions from "../app/modules/TransferTransactions";
import CoinMarketExchange from "../app/modules/CoinMarketExchange";
import Search from "../app/modules/SearchData";
import TPS from "../app/modules/TPS";

import {stringConstants} from "../app/common/constants";

module.exports = (app) => {
    app.get('/', (req, res) => res.send(stringConstants.SERVICE_STATUS_HTML));

    /**
     * Transaction definition
     */
    app.get("/getLatestTransactions", ValidationManger.validateQuery, new Transactions().getLatestTransactions);
    app.get("/getTotalTransactions",  new Transactions().getTotalTransactions);
    app.get("/getTransactionsForAddress/:address",ValidationManger.validateQuery, new Transactions().getTransactionsForAddress);
    app.get("/getTransactionsCountForAddress/:address",  new Transactions().getTransactionsCountForAddress);
    app.get("/getSomeDaysTransactions/:days",  new Transactions().getSomeDaysTransactions);
    app.get("/getTransactionDetails/:hash",  new Transactions().getTransactionDetailsUsingHash);


     /**
     * Transfer Transaction definition
     */
    app.get("/getListOfTransferTransactionsForToken/:contractAddress",ValidationManger.validateQuery,  new TransferTransactions().getListOfTransferTransactionsForToken);
    app.get("/getTotalTransferTransactionForToken/:contractAddress",  new TransferTransactions().getTotalTransferTransactionForToken);
    app.get("/getTransferTransactionDetailsUsingHash/:hash",  new TransferTransactions().getTransferTransactionDetailsUsingHash);


     /**
     * Coin Market Exchange definition
     */
      app.get("/getCoinMarketCap/:fiatValue", new CoinMarketExchange().getCoinMarketCap);
      app.get("/getCoinMarketTotalSupply",  new CoinMarketExchange().getCoinMarketTotalSupply);
      app.get("/getCoinMarketExchangeForToken/:symbol",  new CoinMarketExchange().getCoinMarketExchangeForToken);
      

    /**
     * Search Data definition
     */
     app.post("/searchBlockchainData", new Search().searchBlockchainData);

       /**
     * TPS definition
     */
        app.get("/getCurrentTPS", new TPS().getCurrentTPS);
        app.get("/getMaxTPS", new TPS().getMaxTPS);
};

