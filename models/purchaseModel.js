const mongoose = require("mongoose");

const PurchasePromptSchema = mongoose.Schema(
    {
        promptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            required: true,
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("purchaseprompts", PurchasePromptSchema);
