const { NodemailerTransporter } = require("../nodemailer");

module.exports.sendEmailToChatUser = async (message, chat, sender) => {
    try {
        let mailOptions = {
            from: 'promptsheaven@gmail.com',
            to: chat.email,
            subject: `Recieved message from @${sender.username}`,
            html: this.ReceivedMessage(message, sender)
        };

        await NodemailerTransporter.sendMail(mailOptions);
        return { statusCode: 200, err: null }

    }
    catch (err) {
        console.log(err);
        return { statusCode: 400, err }
    }
}

module.exports.ReceivedMessage = (message, sender) => `
<p>You have receieved message from @${sender.username} </p>
<div>Message: <strong>${message}</strong></div>
<div>If you want to respond <a href="${process.env.Remote_Base}/chat" >Click Here</a><div>
`