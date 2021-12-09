import Utils from '../../utils'
import TransactionModel from "../../models/transaction";
import AccountModel from "../../models/account";
import BlockModel from "../../models/block";
import TokenModel from "../../models/contract";
import { genericConstants } from '../../common/constants';


export default class Manger {

    searchData = async (params) => {
        Utils.lhtLog("BLManager:searchBlockchainData", "searchBlockchainData started", "", "");
        const { filter, data } = params;

        let responseStatus = [], type = ""
        switch (filter) {
            case "All filters":
                type = this.checkDataType(data)
                responseStatus = await this.searchAllFilters(data, type);
                break;
            case "Blocks":
                responseStatus = await this.searchBlock(data);
                break;
            case "Addresses":
                responseStatus = await this.searchAddress(data);
                break;
            case "Tokens":
                type = this.checkDataType(data)
                responseStatus = await this.searchTokens(data, type);
                break;
            case "Transaction":
                responseStatus = await this.searchTransaction(data);
                break;

            default:
                responseStatus = await this.searchAccount(data);
                break;
        }

        if (responseStatus && responseStatus.length > 0) {
            return responseStatus
        } else {
            responseStatus.push({ 'message': 'Data not found' })
        }
        return responseStatus
    }

    checkDataType = (data) => {
        if (data.startsWith("xdc"))
            return genericConstants.REQUEST_TYPE.ADDRESS
        else if (data.startsWith("0x"))
            return genericConstants.REQUEST_TYPE.TRANSACTION
    }


    searchAllFilters = async (data, type) => {

        let responseStatus = [];
        if (type === genericConstants.REQUEST_TYPE.TRANSACTION) {
            const findObj = { "hash": data };
            const transaction = await TransactionModel.findOne(findObj);
            if (transaction) {
                responseStatus.push({ 'redirect': 'transaction', transaction })
                return responseStatus;
            }
        }
        if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
            const findObjAddresses = { "address": data };
            const account = await AccountModel.findOne(findObjAddresses);
            if (account) {
                responseStatus.push({ 'redirect': 'account', account })
                return responseStatus;

            }
        }
        if (!type) {
            const findObjToken = { "tokenName": data, "ERC": { $gte: 2 } };
            const token = await TokenModel.findOne(findObjToken);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
                return responseStatus;
            }
        }
        if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
            const findObj = {
                "address": data,
                "ERC": { $gte: 2 }
            };
            const token = await TokenModel.findOne(findObj);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
                return responseStatus;
            }
        }
        if (!isNaN(data)) {
            let findObjBlock = { "number": data };
            let block = await BlockModel.findOne(findObjBlock);
            if (block) {
                responseStatus.push({ 'redirect': 'block', block })
                return responseStatus;
            }
        }
        return responseStatus;
    }



    searchBlock = async (data) => {
        let responseStatus = []
        const findObjBlock = { "number": data };
        const block = await BlockModel.findOne(findObjBlock);
        if (block) {
            responseStatus.push({ 'redirect': 'block', block })
        }
        return responseStatus;
    }

    searchAddress = async (data) => {
        let responseStatus = []

        const findObj = {
            "address": data
        };
        const account = await AccountModel.findOne(findObj);
        if (account) {
            responseStatus.push({ 'redirect': 'account', account })
        }
        return responseStatus;

    }

    searchTokens = async (data, type) => {
        let responseStatus = []

        const findObj = {
            "address": data,
            "ERC": { $gte: 2 }
        };
        if (type === genericConstants.REQUEST_TYPE.ADDRESS) {
            const token = await TokenModel.findOne(findObj);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
            }
        }
        else {
            let findObjToken = { "tokenName": data, "ERC": { $gte: 2 } };
            let token = await TokenModel.findOne(findObjToken);
            if (token) {
                responseStatus.push({ 'redirect': 'token', token })
            }

        }
        return responseStatus;

    }

    searchTransaction = async (data) => {
        let responseStatus = []

        const findObj = {
            "hash": data
        };
        const transaction = await TransactionModel.findOne(findObj);
        if (transaction) {
            responseStatus.push({ 'redirect': 'transaction', transaction })
        }
        return responseStatus;

    }
    searchAccount = async (data) => {
        let responseStatus = []
        const findObj = {
            "address": data
        };
        const account = await AccountModel.findOne(findObj);
        if (account) {
            responseStatus.push({ 'redirect': 'address', account })
        }
        return responseStatus;

    }
}



