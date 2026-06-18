const { Pool } = require('pg');

let pool;

// Se o site estiver rodando no Render, ele usa a variável online. 
// Se estiver no seu computador, ele usa os dados locais abaixo!
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pessoas_db',
    password: 'vitinho4831',
    port: 5432,
  });
}

// 🔌 Teste de conexão (uma vez só)
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL conectado com sucesso!');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
  });

/* =========================
   CRIAÇÃO DAS TABELAS
========================= */
async function criarTabelas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pessoas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        data_nascimento DATE NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        rg VARCHAR(20),
        cep VARCHAR(10),
        rua VARCHAR(150),
        bairro VARCHAR(100),
        numero VARCHAR(20),
        complemento VARCHAR(100),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        senha VARCHAR(100) NOT NULL
      )
    `);

    await pool.query(`
      INSERT INTO usuarios (usuario, senha)
      VALUES ('admin', '1234')
      ON CONFLICT (usuario) DO NOTHING
    `);

    console.log('✅ Tabelas verificadas/criadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  }
}

// executa ao subir o servidor
criarTabelas();

/* =========================
   CONSULTA ORDENADA (1,2,3...)
========================= */
async function listarPessoasOrdenadas() {
  const result = await pool.query(
    'SELECT * FROM pessoas ORDER BY id ASC'
  );
  return result.rows;
}

module.exports = {
  pool,
  listarPessoasOrdenadas
};
