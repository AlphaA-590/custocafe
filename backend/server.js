'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');

const pool          = require('./db');
const redisClient   = require('./redis');
const glebasRouter       = require('./routes/glebas');
const centroCustosRouter = require('./routes/centro_custos');
const ordemServicosRouter = require('./routes/ordem_servicos');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'custocafe_jwt_secret_change_in_production';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Auth helpers ──────────────────────────────────────────────────────────────
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha)
            return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });

        const hashed = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
            [nome, email, hashed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado' });
        console.error('register error:', err.message);
        res.status(500).json({ error: 'Erro interno' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha)
            return res.status(400).json({ error: 'email e senha são obrigatórios' });

        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user   = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

        const match = await bcrypt.compare(senha, user.senha);
        if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign(
            { id: user.id, email: user.email, nome: user.nome },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
    } catch (err) {
        console.error('login error:', err.message);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/glebas',         glebasRouter);
app.use('/api/centro-custos',  centroCustosRouter);
app.use('/api/ordem-servicos', ordemServicosRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', redis: redisClient.isReady ? 'connected' : 'disconnected' });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
    }
});

// ── Serve React frontend as static files ──────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// SPA fallback – serve index.html for any non-API route
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅  CUSTOCAFE API rodando em http://0.0.0.0:${PORT}`);
});
