const cron = require('node-cron');
const promptModel = require('../models/promptModel');
const { sendNewlyAddedPromptsToFollwers } = require('../nodemailer/emailTemplates/sendToFollowers');


module.exports.approvalCronJob = (cronExpression, promptId, prompt) => {
    const task = cron.schedule(cronExpression, async () => {
        console.log(new Date(), 'approving time');
        await approvePrompt();
    });
    async function approvePrompt() {
        await promptModel.updateOne({ _id: promptId }, { status: "approved" });
        await sendNewlyAddedPromptsToFollwers(prompt);

        setTimeout(() => {
            console.log('task stopped after 5 sec');
            task.stop();
        }, 5000)
    }
}