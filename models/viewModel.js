const mongoose = require("mongoose");

const PromptViewsSchema = mongoose.Schema(
    {
        promptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            required: true,
        },
        viewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("promptviews", PromptViewsSchema);
