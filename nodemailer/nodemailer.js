const nodemailer = require('nodemailer');
module.exports.NodemailerTransporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: `promptsheaven@gmail.com`,
        pass: `vgicblqtjhtqswlv`
    },
    tls: {
        rejectUnauthorized:false
    },
    secure: true
});
