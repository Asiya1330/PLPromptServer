const ObjectId = require("mongoose/lib/types/objectid");
const Prompts = require("../models/promptModel");
const moment = require('moment');
const purchaseModel = require("../models/purchaseModel");
const cron = require('node-cron');
const { approvalCronJob } = require("../cronJobs/scehduleCronJobs");

module.exports.getPrompts = async (req, res, next) => {
    try {
        const { condition, profileOwnerId, type } = req.query;
        console.log(condition);

        if (!condition) return res.status(400).send({ message: 'Condition is required' });
        if (condition === 'newest-type' && !type) return res.status(400).send({ message: 'Type is required' });
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
                        $match: {
                            status: 'approved',
                        }
                    },
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
        let { id, timeInHour, selectedCategories } = req['body'];
        if (!id) throw new Error('prompt id is required');
        console.log(process.env.NODE_APP_INSTANCE, process.env.NODE_ENV);
        // if (process.env.NODE_APP_INSTANCE = '0' || NODE_ENV != 'production') {
        // }
        const prompt = await Prompts.findOneAndUpdate({ _id: req['body'].id }, {
            status: "ready-to-release",
            categories: selectedCategories
        });

        if (!timeInHour) timeInHour = 1;

        const now = new Date();
        const oneHourLater = new Date(now.getTime() + (timeInHour * 60 * 60 * 1000));
        oneHourLater.setSeconds(0);
        oneHourLater.setMilliseconds(0);
        const jobHour = oneHourLater.getHours();
        const jobMinute = oneHourLater.getMinutes();
        console.log(`Prompt will get approved at ${oneHourLater.getHours()}:${oneHourLater.getMinutes()}`);

        const cronExpr = `${jobMinute} ${jobHour} * * *`;

        approvalCronJob(cronExpr, id, prompt);

        res.json(prompt);
    } catch (ex) {
        next(ex);
    }
};


module.exports.insertPrompt = async (req, res, next) => {
    try {
        if (!req['body'].status) req['body'].status = 'pending';

        const data = await Prompts.create(req['body']);
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
                    isFeature: 1,
                    weeklyScore: 1,
                    monthlyScore: 1,
                    categories: 1
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

module.exports.getBadgesByUserID = async (req, res, next) => {
    try {
        const { ownerId } = req['query'];
        const result = await purchaseModel.aggregate([
            {
                $lookup: {
                    from: "prompts",
                    localField: "promptId",
                    foreignField: "_id",
                    as: "prompt"
                }
            },
            {
                $unwind: "$prompt"
            },
            {
                $match: {
                    "prompt.userId": ObjectId(ownerId)
                }
            },
            {
                $unwind: "$prompt.categories"
            },
            {
                $group: {
                    _id: "$prompt.categories",
                    purchaseCount: {
                        $sum: 1
                    }
                }
            },
            {
                $match: {
                    purchaseCount: {
                        $gt: 5
                    }
                }
            }
        ]);

        res.status(200).json(result)
    } catch (ex) {
        console.log(ex);
        next(ex);
    }
}
