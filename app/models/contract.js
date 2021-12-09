let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const ContractSchema = new Schema({
    address: { type: String, default: "" },
    blockNumber: { type: Number, default: 0 },
    ERC: { type: Number, index: true },
    creationTransaction: { type: String, default: "" },
    contractName: { type: String, default: "" },
    tokenName: { type: String, default: "" },
    symbol: { type: String, default: "" },
    owner: { type: String, default: "" },
    decimals: { type: Number, default: "" },
    totalSupply: { type: Number, default: "" },
    compilerVersion: { type: String, default: "" },
    optimization: { type: Boolean, default: false },
    sourceCode: { type: String, default: "" },
    abi: { type: String, default: "" },
    byteCode: { type: String, default: "" },
    createdOn: { type: Number, default: Date.now() },
    modifiedOn: { type: Number, default: Date.now() },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
});

ContractSchema.method({
    saveData: async function () {
        return await this.save();
    },
});

ContractSchema.static({
    getContract: function (findQuery) {
        return this.findOne(findQuery);
    },

    updateContract: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    },

    updateManyContracts: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getContractList: function (findObj, selectionKey = "", skip = 0, limit = 0, sort = 1) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps);
    },
});
module.exports = mongoose.model("xin-contract", ContractSchema);
