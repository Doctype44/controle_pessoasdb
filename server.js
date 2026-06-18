const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { pool } = require('./database');

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   FUNÇÕES AUXILIARES
========================= */
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.substring(10, 11));
}
function validarRG(rg) {
    if (!rg) return false;

    // Remove pontos, traços e espaços
    rg = rg.replace(/[^\dXx]/g, '');

    // Tamanho válido (7 a 9 caracteres)
    if (rg.length < 7 || rg.length > 9) return false;

    // Não permitir todos os números iguais
    if (/^(\d)\1+$/.test(rg) || /^([Xx])\1+$/.test(rg)) return false;


    return true;
}


function gerarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/* =========================
   CONFIGURAÇÃO DO NODemailer (GMAIL TLS)
========================= */
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,          // TLS/SSL
    secure: true,
    auth: {
        user: "vb3777735@gmail.com",      // <--- coloque seu email
        pass: "woch zfij nvwk sfke"          // <--- coloque a senha de app do Gmail
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

/* =========================
   ROTAS HTML
========================= */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

/* =========================
   LOGIN
========================= */
app.post('/login', async (req, res) => {
    const { usuario, senha } = req.body;
    try {
        const result = await pool.query(
            'SELECT id FROM usuarios WHERE usuario = $1 AND senha = $2',
            [usuario, senha]
        );

        if (result.rows.length === 0)
            return res.status(401).json({ erro: 'Usuário ou senha inválidos' });

        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});
/* =========================
   CADASTRO
========================= */
app.post('/cadastro', async (req, res) => {
    const {
        usuario,
        email,
        senha,
        nome,
        cpf,
        data_nascimento
    } = req.body;

    try {
        // verifica se já existe usuário
        const existe = await pool.query(
            'SELECT id FROM usuarios WHERE usuario = $1 OR email = $2',
            [usuario, email]
        );

        if (existe.rowCount > 0) {
            return res.status(400).json({ erro: 'Usuário ou e-mail já cadastrado' });
        }

        // 1️⃣ cria usuário
        const userResult = await pool.query(
            `INSERT INTO usuarios (usuario, email, senha)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [usuario, email, senha]
        );

        const usuarioId = userResult.rows[0].id;

        // 2️⃣ cria pessoa ligada ao usuário
        await pool.query(
            `INSERT INTO pessoas (usuario_id, nome, cpf, data_nascimento)
             VALUES ($1, $2, $3, $4)`,
            [usuarioId, nome, cpf, data_nascimento]
        );

        res.json({ sucesso: true });

    } catch (err) {
        console.error('Erro no cadastro:', err);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
});


/* =========================
   RECUPERAÇÃO DE SENHA
========================= */
app.post('/recuperar-senha', async (req, res) => {
    console.log('📥 Headers:', req.headers);
    console.log('📥 Body recebido:', req.body);

    const { usuario } = req.body;


    try {
        const user = await pool.query(
            'SELECT id, email FROM usuarios WHERE usuario = $1 OR email = $1',
            [usuario]
        );

        if (user.rowCount === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        const codigo = gerarCodigo();
        const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await pool.query(
            `INSERT INTO recuperacao_senha (usuario_id, codigo, expira_em)
             VALUES ($1, $2, $3)`,
            [user.rows[0].id, codigo, expira]
        );

        await transporter.sendMail({
            from: '"Sistema de Recuperação" <vb3777735@gmail.com>',
            to: user.rows[0].email,
            subject: 'Código de recuperação de senha',
            text: `Olá!\n\nSeu código de recuperação é: ${codigo}\nEle expira em 15 minutos.`
        });

        console.log(`📩 Código enviado para ${user.rows[0].email}: ${codigo}`);
        res.json({ sucesso: true });

    } catch (err) {
        console.error('Erro na rota /recuperar-senha:', err.message);
        res.status(500).json({ erro: 'Falha ao conectar com o servidor' });
    }
});

// Verificar código
app.post('/verificar-codigo', async (req, res) => {
    const { usuario, codigo } = req.body;

    try {
        const user = await pool.query(
            'SELECT id FROM usuarios WHERE usuario = $1 OR email = $1',
            [usuario]
        );

        if (user.rowCount === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });

        const codQuery = await pool.query(
            `SELECT * FROM recuperacao_senha WHERE usuario_id = $1 AND codigo = $2`,
            [user.rows[0].id, codigo]
        );

        if (codQuery.rowCount === 0) return res.status(400).json({ erro: 'Código inválido' });

        const registro = codQuery.rows[0];
        if (new Date(registro.expira_em) < new Date()) return res.status(400).json({ erro: 'Código expirado' });

        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Alterar senha via recuperação
app.put('/usuarios/alterar-senha-recuperacao', async (req, res) => {
    const { usuario, novaSenha } = req.body;

    try {
        const user = await pool.query(
            'SELECT id FROM usuarios WHERE usuario = $1 OR email = $1',
            [usuario]
        );

        if (user.rowCount === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });

        await pool.query(
            'UPDATE usuarios SET senha = $1 WHERE id = $2',
            [novaSenha, user.rows[0].id]
        );

        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});
/* =========================
   PESSOAS (API)
========================= */
app.get('/pessoas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.id,
                p.nome,
                p.cpf,
                p.data_nascimento
            FROM pessoas p
            ORDER BY p.id DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar pessoas' });
    }
});

/* =========================
   ESTATÍSTICAS
========================= */
app.get('/estatisticas', async (req, res) => {
    try {
        const pessoas = await pool.query('SELECT COUNT(*) FROM pessoas');
        const usuarios = await pool.query('SELECT COUNT(*) FROM usuarios');

        res.json({
            totalPessoas: Number(pessoas.rows[0].count),
            totalUsuarios: Number(usuarios.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro nas estatísticas' });
    }
});

/* =========================
   RELATÓRIOS - PRAZO VENCIDO
========================= */
app.get('/relatorios/vencidos', async (req, res) => {
    const { periodo } = req.query;

    let filtro = '';
    if (periodo === 'hoje') {
        filtro = `AND data_fim = CURRENT_DATE`;
    } else if (periodo === '7') {
        filtro = `AND data_fim >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (periodo === '30') {
        filtro = `AND data_fim >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    try {
        const result = await pool.query(`
            SELECT 
                id,
                nome,
                cpf,
                data_fim
            FROM pessoas
            WHERE data_fim < CURRENT_DATE
            ${filtro}
            ORDER BY data_fim DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Erro relatório vencidos:', err);
        res.status(500).json({ erro: 'Erro ao buscar relatório' });
    }
});


/* =========================
   ARQUIVOS ESTÁTICOS
========================= */
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
