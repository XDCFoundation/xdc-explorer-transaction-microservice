let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const AddressStatSchema = new Schema({
    address: {type: String, default: ""},
    accountType: {type: Number, default: 0},
    balance: {type: Number, default: 0},
    timestamp: {type: Number, default: 0},
    avgBalance: {type: Number, default: 0},
    gasFee: {type: Number, default: 0},
    totalTransactionsCount: {type: Number, default: 0},
    fromTransactionsCount: {type: Number, default: 0},
    toTransactionsCount: {type: Number, default: 0},
    tokens: {type: Schema.Types.Mixed, default: []},
    highestTransaction: {type: Number, default: 0},
    lastTransactionTimestamp: {type: Number, default: 0},
    createdOn: {type: Number, default: Date.now()},
    modifiedOn: {type: Number, default: Date.now()},
    isDeleted: {type: Boolean, default: false},
    isActive: {type: Boolean, default: true},
});


AddressStatSchema.method({
    saveData: async function () {
        return await this.save();
    },
});
AddressStatSchema.static({
    getAccount: function (findQuery) {
        return this.findOne(findQuery);
    },
    updateAccount: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnOriginal: true,
            upsert: true
        });
    },
    updateManyAccounts: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getAccountList: function (findObj, selectionKey = "", skip = 0, limit = 0, sort = 1) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps)
    }
});
module.exports = mongoose.model("xin-address-stat", AddressStatSchema);