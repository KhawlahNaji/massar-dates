const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'khwlah7712@gmail.com',
        pass: 'vpshrgzhytlpusfg'
    },
    tls: { rejectUnauthorized: false }
});

const mailOptions = {
    from: 'MASSAR DATES <khwlah7712@gmail.com>',
    to: 'khwlah7712@gmail.com',
    subject: 'Test Email - Massar',
    text: 'This is a test email.',
    html: '<h1>Test Email</h1><p>Hello!</p>'
};

transporter.sendMail(mailOptions)
    .then(info => console.log('✅ Email sent successfully:', info.messageId))
    .catch(err => console.error('❌ Error:', err.message));
