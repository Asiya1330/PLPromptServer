const ObjectId = require("mongoose/lib/types/objectid");
const Prompts = require("../models/promptModel");
const moment = require('moment');

module.exports.getPrompts = async (req, res, next) => {
    /**
     * newewst find({userId: profileOwnerId})sort({createdAt:1})
     * popular sort({purchaseCount:1})
     * featured {feature:true}
     * hottest sort({views:1})
     */
    try {
        const { condition, profileOwnerId, type } = req.query;
        if (!condition) return res.status(400).send({ message: 'Condition is required' });
        if (condition === 'newest-type' && !type) return res.status(400).send({ message: 'Type is required' });
        // if (condition === 'popular-by-id' && !type) return res.status(400).send({ message: 'Type is required' });
        // if (condition === 'newest-by-id' && !profileOwnerId) return res.status(400).send({ message: 'profileOwnerId is required' });

        let prompts = [];
        switch (condition) {
            case 'newest-by-id':
                prompts = await Prompts.find({ userId: profileOwnerId, status: 'approved' }).sort({ createdAt: -1 });
                break;
            case 'newest':
                prompts = await Prompts.find({ status: 'approved' }).sort({ createdAt: -1 });
                break;
            case 'newest-type':
                prompts = await Prompts.find({ type, status: 'approved' }).sort({ createdAt: -1 });
                break;
            case 'popular':
                prompts = await Prompts.aggregate([
                    {
                        $addFields: {
                            totalScore: { $sum: ["$likes", "$views", "$purchaseCount"] }
                        }
                    },
                    {
                        $sort: { totalScore: -1 }
                    }
                ])
                break;
            case 'popular-by-id':
                prompts = await Prompts.aggregate([
                    {
                        $match: {
                            userId: ObjectId(profileOwnerId),
                            status: 'approved',
                        }
                    },
                    {
                        $addFields: {
                            totalScore: { $sum: ["$likes", "$purchases", "$views"] }
                        }
                    },
                    {
                        $sort: { totalScore: -1 }
                    }
                ])
                break;
            case 'featured':
                prompts = await Prompts.find({ isFeature: true, status: 'approved' });
                break;
            case 'hottest':
                prompts = await Prompts.find({ status: 'approved' }).sort({ likes: -1 });
                break;
            default:
                return res.status(400).send({ message: 'Invalid condition' });
        }
        return res.send(prompts);
    } catch (error) {
        console.error(error);
        next(error)
    }
}

module.exports.markFeatured = async (req, res, next) => {
    try {
        let { _id } = req['body'];
        const prompts = await Prompts.updateOne({ _id }, {
            isFeature: true
        })
        res.json(prompts);
    } catch (ex) {
        next(ex);
    }
};

module.exports.approvePrompt = async (req, res, next) => {
    try {
        let { id, timeInHour } = req['body'];
        if (!id) throw new Error('prompt id is required');
        // if (process.env.NODE_APP_INSTANCE = '0' || NODE_ENV != 'production') {
        // }
        const prompts = await Prompts.updateOne({ _id: req['body'].id }, { status: "ready-to-release" });
        if (!timeInHour) timeInHour = 1;
        const timeInMS = timeInHour * 60000 * 60
        setTimeout(async () => {
            console.log(`releasing prompt after ${timeInHour} mins`);
            await Prompts.updateOne({ _id: req['body'].id }, { status: "approved" });
        }, timeInMS)

        res.json(prompts);
    } catch (ex) {
        next(ex);
    }
};


module.exports.insertPrompt = async (req, res, next) => {
    try {
        let { type,
            description,
            price,
            name,
            prompt,
            profileLink,
            promptIns,
            userId,
            images, status } = req['body'];

        if (!status) status = 'pending';

        if (!type
            || !description
            || !price
            || !name
            || !prompt
            || !profileLink
            || !promptIns
            || !userId
            || !images
        )
            throw new Error('Required args are missing');

        const data = await Prompts.create({
            type,
            description,
            price,
            name,
            prompt,
            midjourney_pflink: profileLink,
            prompt_ins: promptIns,
            userId,
            images,
            status
        });
        if (data) return res.json(data);
        else return res.json({ msg: "Failed to add prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.fetchNonApprovedPrompts = async (req, res, next) => {
    try {
        const prompts = await Prompts.find({ status: { $eq: 'pending' } });
        if (prompts) return res.json(prompts);
        else return res.json({ msg: "Failed to add prompt to the database" });
    } catch (ex) {
        next(ex);
    }
};




module.exports.getTrendingPromptsBasedOnHourlyFactor = async (req, res, next) => {
    try {
        const prompts = await Prompts.aggregate([
            {
                $match: {
                    status: "approved"
                }
            },
            {
                $addFields: {
                    age_in_hours: {
                        $divide: [{
                            $subtract: [new Date(), "$createdAt"]
                        }, 1000 * 60 * 60]
                    }
                }
            },
            {
                $addFields: {
                    totalSum: {
                        $switch: {
                            branches: [
                                {
                                    case: { $lt: ["$age_in_hours", 1] },
                                    then: {
                                        $multiply: [{
                                            $add: [
                                                { $multiply: ["$views", 1] },
                                                { $multiply: ["$likes", 2] },
                                                { $multiply: ["$purchaseCount", 4] }
                                            ]
                                        }, 3]
                                    }
                                },
                                {
                                    case: { $lt: ["$age_in_hours", 2] },
                                    then: {
                                        $multiply: [{
                                            $add: [
                                                { $multiply: ["$views", 1] },
                                                { $multiply: ["$likes", 2] },
                                                { $multiply: ["$purchaseCount", 4] }
                                            ]
                                        }, 2]
                                    }
                                },
                                {
                                    case: { $lt: ["$age_in_hours", 3] },
                                    then: {
                                        $add: [
                                            { $multiply: ["$views", 1] },
                                            { $multiply: ["$likes", 2] },
                                            { $multiply: ["$purchaseCount", 4] }
                                        ]
                                    }
                                }
                            ],
                            default: {
                                $add: [
                                    { $multiply: ["$views", 1] },
                                    { $multiply: ["$likes", 2] },
                                    { $multiply: ["$purchaseCount", 4] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $sort: {
                    totalSum: -1
                }
            },
            {
                $project: {
                    age_in_hours: 1,
                    _id: 1,
                    totalSum: 1,
                    prompt: 1,
                    type: 1,
                    description: 1,
                    price: 1,
                    name: 1,
                    midjourney_pflink: 1,
                    prompt_ins: 1,
                    userId: 1,
                    images: 1,
                    purchaseCount: 1,
                    views: 1,
                    likes: 1,
                    createdAt: 1,
                    status: 1,
                    isFeature: 1
                }
            }
        ]);

        const filteredPrompts = prompts.map((prompt) => {
            prompt.createdAt = moment(prompt.createdAt, "YYYYMMDD").fromNow();
            return prompt
        })
        res.status(200).json(filteredPrompts)
    } catch (ex) {
        console.log(ex);
        next(ex);
    }
};