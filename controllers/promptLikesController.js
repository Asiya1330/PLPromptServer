const PromptLikes = require("../models/LikesModel");
const Prompt = require("../models/promptModel");


module.exports.insertPromptLikes = async (req, res, next) => {
    try {
        const { promptId, likerId } = req['body']

        if (!promptId || !likerId)
            throw new Error('Required args are missing');

        const data = await PromptLikes.create(req['body']);
        await Prompt.updateOne({ _id: promptId }, { $inc: { likes: 1 } })
        if (data) return res.json(data);
        else return res.json({ msg: "Failed to add prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.getPromptLikeByUserId = async (req, res, next) => {
    try {
        const { userId, promptId } = req['params']
        if (!userId || !promptId)
            throw new Error('Required args are missing');

        const data = await PromptLikes.find({ likerId: userId, promptId });
        if (data) return res.json(data);
        else return res.json({ msg: "Failed to find prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};
