/**
 * Created by AyushK on 18/09/20.
 */
import * as ValidationManger from "../middleware/validation";
import Transactions from "../app/modules/Transactions";
import TransferTransactions from "../app/modules/TransferTransactions";

import {stringConstants} from "../app/common/constants";

module.exports = (app) => {
    app.get('/', (req, res) => res.send(stringConstants.SERVICE_STATUS_HTML));

    /**
     * route definition
     */
    app.get("/getLatestTransactions",  new Transactions().getLatestTransactions);
    app.get("/getTotalTransactions",  new Transactions().getTotalTransactions);

    app.get("/getTransactionsForAddress/:address",  new Transactions().getTransactionsForAddress);
    app.get("/getTransactionsCountForAddress/:address",  new Transactions().getTransactionsCountForAddress);
    app.get("/getSomeDaysTransactions/:days",  new Transactions().getSomeDaysTransactions);
    app.get("/getTransactionDetails/:hash",  new Transactions().getTransactionDetailsUsingHash);
    app.get("/getTransactionDetails/:hash",  new Transactions().getTransactionDetailsUsingHash);
    app.get("/getListOfTransferTransactionsForToken/:address",  new TransferTransactions().getListOfTransferTransactionsForToken);

};
