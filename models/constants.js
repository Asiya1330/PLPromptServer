const mongoose = require("mongoose");

const ConstantSchema = mongoose.Schema(
    {
        latest_approve_time: {
            type: Date
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("constants", ConstantSchema);
