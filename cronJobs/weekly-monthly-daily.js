

// Products table: id, name, description, price, image_url, created_at, updated_at
// Views table: id, product_id, count, date
// Purchases table: id, product_id, count, date
// Likes table: id, product_id, count, date
// Rankings table: id, product_id, type, score, date
// The product_id field is a foreign key that references the id field in the products table. The count field in the views, purchases, and likes tables represents the number of views, purchases, or likes for a product on a particular day.

// Set up a job scheduler, such as node-cron or agenda, to run daily, weekly, and monthly jobs to calculate the rankings. The jobs will run queries to aggregate the views, purchases, and likes for each product and update the rankings table with the scores for each product. The type field in the rankings table represents the period for the ranking (daily, weekly, or monthly).

// For example, here's a sample code snippet using node-cron to schedule daily, weekly, and monthly jobs:

// # Daily job
// 0 0 * * * /path/to/daily-job.js >> /path/to/daily-job.log 2>&1

// // # Weekly job (run on Sundays at midnight)
// 0 0 * * 0 /path/to/weekly-job.js >> /path/to/weekly-job.log 2>&1

// // # Monthly job (run on the first day of the month at midnight)
// 0 0 1 * * /path/to/monthly-job.js >> /path/to/monthly-job.log 2>&1

// Schedule daily, weekly, and monthly jobs
const Prompt = require('../models/promptModel');
const Like = require('../models/LikesModel')
const Purchase = require('../models/purchaseModel')
const View = require('../models/viewModel');
const purchaseModel = require('../models/purchaseModel');
const now = new Date();

async function calculateRankings(type) {
    console.log('====================================');
    console.log(type, 'starts');
    console.log('====================================');
    let startDate, endDate;
    if (type === 'daily') {
        startDate = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
        endDate = (new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)).toISOString();
    }
    else if (type === 'weekly') {
        startDate = (new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)).toISOString();
        endDate = (new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)).toISOString();
    }
    else if (type === 'monthly') {
        startDate = (new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
        endDate = (new Date(now.getFullYear(), now.getMonth() + 1, 1)).toISOString();
    }

    const prompts = await Prompt.find();
    for (const prompt of prompts) {

        const views = await View.countDocuments({
            promptId: prompt._id,
            createdAt: {
                $gt: startDate,
                $lt: endDate
            }
        });

        const purchases = await Purchase.countDocuments({
            promptId: prompt._id,
            createdAt: {
                $gt: startDate,
                $lt: endDate
            }
        })

        const likes = await Like.countDocuments({
            promptId: prompt._id,
            createdAt: {
                $gt: startDate,
                $lt: endDate
            }
        })
        const score = views * 1 + likes * 2 + purchases * 4;
        if (type === 'monthly') {
            const res = await Prompt.updateOne({ _id: prompt._id }, {
                monthlyScore: score
            })
            console.log('====================================');
            console.log(res, 'for monthly with score:', score);
            console.log('====================================');
        }
        if (type === 'weekly') {
            const res = await Prompt.updateOne({ _id: prompt._id }, {
                weeklyScore: score
            })
            console.log('====================================');
            console.log(res, 'for weekly with score:', score);
            console.log('====================================');
        }

    }
}

const migrationOfPrompts = async () => {
    const prompts = await Prompt.find();
    for (const prompt of prompts) {
        const views = await View.countDocuments({
            promptId: prompt._id,
        });

        const purchases = await Purchase.countDocuments({
            promptId: prompt._id,
        })

        const likes = await Like.countDocuments({
            promptId: prompt._id,

        })
        const res = await Prompt.updateOne({ _id: prompt._id }, {
            likes: likes,
            views: views,
            purchaseCount: purchases
        })
        console.log(res);
    }

}

const addStatusColumnInPrompts = async () => {
    const prompts = await Prompt.find();
    for (const prompt of prompts) {
        const res = await Prompt.updateOne({ _id: prompt._id }, {
            status: 'approved'
        })
        console.log('====================================');
        console.log(res);
        console.log('====================================');
    }
}

const addPurchaseRecordtoPetio = async () => {
    // const data = await Prompt.updateMany({ userId: "642f16baea34422083f8e6a2" }, {
    //     categories: [
    //         "3D",
    //         "Accessory",
    //         "Animal",
    //         "Anime",
    //         "Avatar",
    //         "Unique Style",
    //         "Vehicle",
    //         "Wallpaper",
    //     ]
    // })

    // const data = await Prompt.find({ userId: "642f16baea34422083f8e6a2" })
   
    // await data.map(async (prompt) => {
    //     const result = await purchaseModel.insertMany({ promptId: prompt._id, buyerId: '642f16deea34422083f8e6a8' })
    //     console.log(result, 'result');
    // })
}

module.exports = {
    calculateRankings,
    migrationOfPrompts,
    addStatusColumnInPrompts,
    addPurchaseRecordtoPetio
};
