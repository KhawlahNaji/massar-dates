var nodemailer = require('nodemailer');
var t = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'khwlah7712@gmail.com',
        pass: 'vpshrgzhytlpusfg'
    }
});
t.sendMail({
    from: 'khwlah7712@gmail.com',
    to: 'khwlah7712@gmail.com',
    subject: 'Test Email',
    text: 'Hello from Massar Dates'
}, function(err, info) {
    if (err) console.log('ERROR: ' + err.message);
    else console.log('SUCCESS: ' + info.response);
});