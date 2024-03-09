const nodemailer = require('nodemailer');



async function sendConfirmationEmail(userEmail, subject, content) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Or use your email service provider
        auth: {
            user: 'stnuptrainingoffice@gmail.com',
            pass: 'neaq tyuq pdiu nepu'
        }
    });

    let mailOptions = {
        from: 'stnuptrainingoffice@gmail.com',
        to: userEmail,
        subject: subject,
        text: content,
    };

    await transporter.sendMail(mailOptions);
}
module.exports=sendConfirmationEmail
