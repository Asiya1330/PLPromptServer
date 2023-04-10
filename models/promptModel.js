
const mongoose = require("mongoose");

const PromptSchema = mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            min: 3,
            max: 40,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            unique: true,
        },
        prompt: {
            type: String,
            required: true,
        },
        midjourney_pflink: {
            type: String,
            required: true,
        },
        prompt_ins: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        images: {
            type: Array
        },
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        purchaseCount: {
            type: Number,
            default: 0
        },
        category: {
            type: String,
        },
        status: {
            type: String,
            required: true,
            default: 'pending',
            enum: ['approved', 'pending', 'declined', 'ready-to-release'],
        },
        isFeature: {
            type: Boolean
        },
        weeklyScore: {
            type: Number
        },
        monthlyScore: {
            type: Number
        },
        trending_points: { type: Number },
        categories: {
            type: Array,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Prompts", PromptSchema);
