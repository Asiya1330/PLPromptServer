const { NodemailerTransporter } = require("../nodemailer");

module.exports.sendverificationemail = async (req) => {
    try {
        const { emailToVerify, id } = req.params;
        if (!emailToVerify || !id) return res.json({ msg: "please provide emailToVerify and id", status: false });

        let mailOptions = {
            from: 'gagabooboo987@gmail.com',
            to: emailToVerify,
            subject: 'Verify your email',
            html: this.verifyEmail(id)
        };

        const response = await NodemailerTransporter.sendMail(mailOptions);
        return { msg: "Succesfully sent email", response }

    } catch (ex) {
        console.log(ex);;
    }
};

module.exports.verifyEmail = (newUserID) => `
<p>Click the link below to verify your email:</p>
<p>
    <a href="${process.env.Remote_Base}/?token=${newUserID}">
        Verify email
    </a>
</p>
`
