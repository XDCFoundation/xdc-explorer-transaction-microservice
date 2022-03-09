let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const NetworkSchema = new Schema({
  RPC_URL: { type: String, default: "" },
  blockExplorer: { type: String, default: "" },
  chainID: { type: Number, default: 50 },
  createdOn: { type: Number, default: Date.now() },
  modifiedOn: { type: Number, default: Date.now() },
  currencySymbol: { type: String, default: "" },
  networkName: { type: String, default: "" },
  isDeleted: {type: Boolean, default: false},
    isActive: {type: Boolean, default: true},
});

NetworkSchema.method({
  saveData: async function () {
    return await this.save();
  },
});
NetworkSchema.static({
  getNetworkDetails: function (findObj) {
    return this.find(findObj);
  },
});
module.exports = mongoose.model("xin-networkdetail", NetworkSchema);
