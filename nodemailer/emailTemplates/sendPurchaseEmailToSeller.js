const userModel = require("../../models/userModel");
const { NodemailerTransporter } = require("../nodemailer");

module.exports.sendEmailToSeller = async (customer, prompt) => {
    console.log(prompt.userId);
    const sellerDetails = await userModel.findOne({ _id: prompt.userId });

    let mailOptions = {
        from: 'promptsheaven@gmail.com',
        to: sellerDetails.email,
        subject: `Congratulations! @${customer.username} has bought your prompt.`,
        html: this.PurchasePrompt(prompt, customer)
    };

    const response = await NodemailerTransporter.sendMail(mailOptions);
    return { msg: "Succesfully sent email", response }
}

module.exports.PurchasePrompt = (prompt, customer) => `
<p>Congratulations! Your prompt <strong>${prompt.name}</strong> has been bought by our valuable customer 
<strong>@${customer.username}<strong> </p>
`