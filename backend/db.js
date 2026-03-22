'use strict';

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    console.log('✅  PostgreSQL conectado');
});

pool.on('error', (err) => {
    console.error('❌  Erro inesperado no pool do PostgreSQL:', err.message);
});

// Verify connectivity on startup (non-fatal)
pool.query('SELECT NOW()')
    .then(res => console.log(`🕐  DB time: ${res.rows[0].now}`))
    .catch(err => console.error('⚠️   Não foi possível conectar ao PostgreSQL:', err.message));

module.exports = pool;
