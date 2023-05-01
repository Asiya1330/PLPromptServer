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
        },
        prompt_ins: {
            type: String,
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
        },
        gpt_cat: {
            type: String,
        },
        testing_prompt: {
            type: String,
        },
        engine: {
            type: String,
        },
        preview_output: {
            type: String,
        },
        preview_input: {
            type: String,
        },
        sd_model: {
            type: String,
        },
        sd_sampler: {
            type: String,
        },
        sd_img_width: {
            type: Number,
        },
        sd_img_height: {
            type: Number,
        },
        sd_steps: {
            type: Number,
        },
        sd_cfg_scale: {
            type: Number,
        },
        sd_seed: {
            type: String,
        },
        sd_clip_guide: {
            type: Boolean,
        },
        sd_neg_prompt: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Prompts", PromptSchema);
