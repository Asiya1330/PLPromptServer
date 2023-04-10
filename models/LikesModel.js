const mongoose = require("mongoose");

const FavPromptSchema = mongoose.Schema(
    {
        promptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            required: true,
        },
        likerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("favprompts", FavPromptSchema);
