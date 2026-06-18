// teste-email-tls.js
const nodemailer = require('nodemailer');

// 🔹 Configuração segura do transporte de e-mail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,          // porta SSL
    secure: true,       // SSL ativo
    auth: {
        user: 'vb3777735@gmail.com',  // seu e-mail Gmail
        pass: 'mfga ycbn lity hsym'   // senha de app gerada no Gmail
    }
});

transport.sendMail({
    from: '"Teste de E-mail" <vb3777735@gmail.com>',    // remetente
    to: 'vb3777735@gmail.com',                     // destinatário
    subject: 'E-mail de Teste via Node.js',         // assunto
    html: '<h1>Olá!</h1><p>Este é um e-mail de teste enviado via Node.js usando Nodemailer com TLS.</p>'
})
transporter.sendMail(mailOptions)
    .then(() => console.log('✅ E-mail enviado com sucesso!'))
    .catch((err) => console.log('❌ Erro ao enviar e-mail:', err));
