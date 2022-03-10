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
    app.get("/getNetworkDetails",  new Transactions().getNetworkDetails);
    app.get("/getTransactionsForAddress/:address",ValidationManger.validateQuery, new Transactions().getTransactionsForAddress);
    app.get("/address-transaction-filters/:address", new Transactions().getFiltersForAddressTxn);
    app.post("/address-transaction-list/:address", new Transactions().getFilteredTransactionsForAddress);
    app.get("/getTransactionsCountForAddress/:address",  new Transactions().getTransactionsCountForAddress);
    app.get("/getSomeDaysTransactions/:days",  new Transactions().getSomeDaysTransactions);
    app.get("/getTransactionDetails/:hash",  new Transactions().getTransactionDetailsUsingHash);
    app.get("/getAddressStats/:address",  new Transactions().getAddressStats);


     /**
     * Transfer Transaction definition
     */
    app.post("/getListOfTransferTransactionsForToken/:contractAddress",ValidationManger.validateBody,  new TransferTransactions().getListOfTransferTransactionsForToken);
    app.get("/getTotalTransferTransactionForToken/:contractAddress",  new TransferTransactions().getTotalTransferTransactionForToken);
    app.get("/getTransferTransactionDetailsUsingHash/:hash",  new TransferTransactions().getTransferTransactionDetailsUsingHash);


     /**
     * Coin Market Exchange definition
     */
      app.get("/getCoinMarketCap/:fiatValue", new CoinMarketExchange().getCoinMarketCap);
      app.get("/getCoinMarketTotalSupply",  new CoinMarketExchange().getCoinMarketTotalSupply);
      app.get("/getCoinMarketExchangeForToken/:symbol",  new CoinMarketExchange().getCoinMarketExchangeForToken);
      app.get("/getCoinMarketDetailForTransaction", new CoinMarketExchange().getCoinMarketDetailForTransaction);

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

