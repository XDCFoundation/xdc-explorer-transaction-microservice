let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const MaxtpsSchema = new Schema({
    maxtps: {type: Number, default: 0},
});
MaxtpsSchema.method({
    saveData: async function () {
        return await this.save();
    },
});
MaxtpsSchema.static({
    getMaxtps: function (findQuery) {
        return this.findOne(findQuery);
    },
    updateMaxtps: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    }
});
module.exports = mongoose.model("xin-maxtp", MaxtpsSchema);