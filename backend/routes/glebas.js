'use strict';

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET / – List all glebas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT g.*, s.nome AS setor_nome FROM glebas g LEFT JOIN setores s ON g.setor_id = s.id ORDER BY g.id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /glebas error:', err.message);
        res.status(500).json({ error: 'Erro ao buscar glebas' });
    }
});

// POST / – Create a new gleba
router.post('/', async (req, res) => {
    try {
        const { nome, setor_id, area_hectares } = req.body;
        if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

        const result = await pool.query(
            'INSERT INTO glebas (nome, setor_id, area_hectares) VALUES ($1, $2, $3) RETURNING *',
            [nome, setor_id || null, area_hectares || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /glebas error:', err.message);
        res.status(500).json({ error: 'Erro ao criar gleba' });
    }
});

// GET /:id – Get a single gleba
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT g.*, s.nome AS setor_nome FROM glebas g LEFT JOIN setores s ON g.setor_id = s.id WHERE g.id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gleba não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('GET /glebas/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao buscar gleba' });
    }
});

// PUT /:id – Update a gleba
router.put('/:id', async (req, res) => {
    try {
        const { nome, setor_id, area_hectares } = req.body;
        const result = await pool.query(
            `UPDATE glebas
             SET nome = COALESCE($1, nome),
                 setor_id = COALESCE($2, setor_id),
                 area_hectares = COALESCE($3, area_hectares)
             WHERE id = $4
             RETURNING *`,
            [nome, setor_id, area_hectares, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gleba não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /glebas/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar gleba' });
    }
});

// DELETE /:id – Delete a gleba
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM glebas WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gleba não encontrada' });
        res.json({ message: 'Gleba removida com sucesso', id: result.rows[0].id });
    } catch (err) {
        console.error('DELETE /glebas/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao remover gleba' });
    }
});

module.exports = router;
