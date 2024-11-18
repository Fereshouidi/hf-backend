const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fereshouidi298@gmail.com',
        pass: 'ogsk yoaa pwbv rzzv'
    }
});



router.post('/send/activationCode', async(req, res) => {
    const { to, activationCode } = req.body;
    const mailOptions = {
        from: 'fereshouidi298@gmail.com',
        to: to,
        subject: 'Account Activation Code',
        text: `Your activation code is: ${activationCode}`,
        html: `<p>Your activation code is:</p><h3>${activationCode}</h3>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});


module.exports = router;
