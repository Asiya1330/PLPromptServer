const followers = require("../../models/followers");
const { NodemailerTransporter } = require("../nodemailer");

module.exports.sendNewlyAddedPromptsToFollwers = async (prompt) => {
    try {
        const getFollowers = await followers.aggregate([
            {
                $match: {
                    "userId": prompt.userId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "followerId",
                    foreignField: "_id",
                    as: "followers"
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    followers: 1
                }
            }
        ])

        const followersList = getFollowers.map((item) => {
            return item.followers[0]
        })
        const followersEmail = followersList.map(follower => follower.email);
        console.log(followersEmail);
        if (followersEmail.length) {
            let mailOptions = {
                from: 'gagabooboo987@gmail.com',
                to: followersEmail,
                subject: `New Prompt "${prompt.name}" released`,
                html: this.newPromptReleased(prompt.name)
            };
            const response = await NodemailerTransporter.sendMail(mailOptions);
            return { msg: "Succesfully sent email", response }
        }
        return { msg: "No followers found" }

    } catch (ex) {
        console.log(ex);;
    }
};

module.exports.newPromptReleased = (name) => `
<h1>New Prompt "${name}" released</h1>
<a href='http://localhost:3000/prompt/${encodeURIComponent(name)}'>Go check it out</a>
`
