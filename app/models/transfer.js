let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const TokenTransferSchema = new Schema(
    {
        hash: { type: String, default: "" },
        blockNumber: { type: Number, default: "" },
        method: { type: String, default: "" },
        from: { type: String, default: "" },
        to: { type: String, default: "" },
        contract: { type: String, default: "" },
        value: { type: String, default: "" },
        timestamp: { type: Number, default: "" },
    }
);

TokenTransferSchema.method({
    saveData: async function () {
        return await this.save();
    },
});
TokenTransferSchema.static({
    getToken: function (findQuery) {
        return this.findOne(findQuery);
    },
    updateToken: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    },
    updateManyTokens: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getTokenList: function (
        findObj,
        selectionKey = "",
        skip = 0,
        limit = 0,
        sort = 1
    ) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps);
    },
    countData: function (query) {
        return this.countDocuments(query);
    }
});
module.exports = mongoose.model("xin-transfertoken", TokenTransferSchema);
