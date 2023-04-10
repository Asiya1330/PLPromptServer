const PromptModel = require("../models/promptModel");
const PromptPurchases = require("../models/purchaseModel");

module.exports.insertPromptPurchase = async (req, res, next) => {
    try {
        const { promptId, buyerId } = req['body']

        if (!promptId || !buyerId)
            throw new Error('Required args are missing');

        const data = await PromptPurchases.create(req['body']);
        await PromptModel.updateOne({ _id: promptId }, { $inc: { purchaseCount: 1 } })

        if (data) return res.json(data);
        else return res.json({ msg: "Failed to add prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.getPromptPurchaseByUserId = async (req, res, next) => {
    try {
        const { userId, promptId } = req['params']

        if (!userId || !promptId)
            throw new Error('Required args are missing');

        const data = await PromptPurchases.find({ buyerId: userId, promptId });
        if (data) return res.json(data);
        else return res.json({ msg: "Failed to find promptPurchase to the database" });
    } catch (ex) {
        next(ex);
    }
};