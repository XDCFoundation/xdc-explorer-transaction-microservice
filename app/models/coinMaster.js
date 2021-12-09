let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const CoinMasterSchema = new Schema({
    id: {type: Number, default: 0},
    name: {type: String, default: ""},
    symbol: {type: String, default: ""},
    slug: {type: String, default: ""},
    numMarketPairs: {type: Number, default: 0},
    dateAdded: {type: String, default: ""},
    lastUpdated: {type: Number, default: Date.now()},
    errorCode: {type: Number, default: 0},
    errorMessage: {type: String, default: ""},
    creditCount: {type: Number, default: 0},
    maxSupply: {type: Number, default: 0},
    circulatingSupply: {type: Number, default: 0},
    totalSupply: {type: Number, default: 0},
    cmcRank: {type: Number, default: 0},
    isFiat: {type: Number, default: 0},
    fiatValue: {type: String, default: ""},
    price: {type: Number, default: 0},
    pricePercentChangePerHour: {type: String, default: ""},
    marketCap: {type: Number, default: 0},
    fullyDilutedMarketCap: {type: Number, default: 0},
    volume: {type: Number, default: 0},
    volumeMarketCap: {type: Number, default: 0},
    isActive: {type: Number, default: 0},
    quote: {type: Array, default: {}},
});

CoinMasterSchema.method({
    saveData: async function () {
        return await this.save();
    },
});

CoinMasterSchema.static({
    getCoinMarketCap: function (findQuery) {
        return this.findOne(findQuery);
    },

    updateCoinMarketCap: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {returnNewDocument: true,});
    },

    updateManyCoinMarketCap: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getCoinMarketCapList: function (findObj, selectionKey = "", skip = 0, limit = 0, sort = 1) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps);
    },
});
module.exports = mongoose.model(" xin-coin-market-exchange", CoinMasterSchema);
