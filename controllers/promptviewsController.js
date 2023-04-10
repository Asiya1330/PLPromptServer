const PromptModel = require("../models/promptModel");
const PromptViews = require("../models/viewModel");

module.exports.insertPromptViews = async (req, res, next) => {
    try {
        const { promptId, viewerId } = req['body']
        if (!promptId || !viewerId)
            throw new Error('Required args are missing');

        const data = await PromptViews.create(req['body']);
        await PromptModel.updateOne({ _id: promptId }, { $inc: { views: 1 } })
        if (data) return res.json(data);
        else return res.json({ msg: "Failed to add prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.getPromptViewByUserId = async (req, res, next) => {
    try {
        const { userId, promptId } = req['params']

        if (!userId || !promptId)
            throw new Error('Required args are missing');

        const data = await PromptViews.find({ viewerId: userId, promptId });
        if (data) return res.json(data);
        else return res.json({ msg: "Failed to find prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};
