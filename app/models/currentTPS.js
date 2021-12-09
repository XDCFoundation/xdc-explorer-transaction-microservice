let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const CurrenttpsSchema = new Schema({
    currenttps: {type: Number, default: 0},
});
CurrenttpsSchema.method({
    saveData: async function () {
        return await this.save();
    },
});
CurrenttpsSchema.static({
    getCurrenttps: function (findQuery) {
        return this.findOne(findQuery);
    },
    updateCurrenttps: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    }
});
module.exports = mongoose.model("xin-currenttp", CurrenttpsSchema);