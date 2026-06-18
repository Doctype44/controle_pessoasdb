// teste-email-tls.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'vb3777735@gmail.com',
        pass: 'mfga ycbn lity hsym' // senha de app
    }
});

const mailOptions = {
    from: '"Teste de E-mail" <vb3777735@gmail.com>',
    to: 'vb3777735@gmail.com',
    subject: 'E-mail de Teste via Node.js',
    html: '<h1>Olá!</h1><p>Este é um e-mail de teste enviado via Node.js usando Nodemailer com TLS.</p>'
};

transporter.sendMail(mailOptions)
    .then(() => console.log('✅ E-mail enviado com sucesso!'))
    .catch(err => console.log('❌ Erro ao enviar e-mail:', err));
