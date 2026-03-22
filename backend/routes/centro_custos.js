'use strict';

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET / – List all cost centers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cc.*,
                    m.nome AS mao_obra_nome,
                    ma.nome AS maquina_nome
             FROM centro_custos cc
             LEFT JOIN mao_obra_contratada m  ON cc.mao_obra_id = m.id
             LEFT JOIN maquinas_automotoras ma ON cc.maquina_id  = ma.id
             ORDER BY cc.id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /centro-custos error:', err.message);
        res.status(500).json({ error: 'Erro ao buscar centros de custo' });
    }
});

// POST / – Create a new cost center
router.post('/', async (req, res) => {
    try {
        const { descricao, valor, mao_obra_id, maquina_id, data_lancamento } = req.body;
        if (!descricao) return res.status(400).json({ error: 'descricao é obrigatória' });

        const result = await pool.query(
            `INSERT INTO centro_custos (descricao, valor, mao_obra_id, maquina_id, data_lancamento)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [descricao, valor || 0, mao_obra_id || null, maquina_id || null, data_lancamento || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /centro-custos error:', err.message);
        res.status(500).json({ error: 'Erro ao criar centro de custo' });
    }
});

// PUT /:id – Update a cost center
router.put('/:id', async (req, res) => {
    try {
        const { descricao, valor, mao_obra_id, maquina_id, data_lancamento } = req.body;
        const result = await pool.query(
            `UPDATE centro_custos
             SET descricao      = COALESCE($1, descricao),
                 valor          = COALESCE($2, valor),
                 mao_obra_id    = COALESCE($3, mao_obra_id),
                 maquina_id     = COALESCE($4, maquina_id),
                 data_lancamento = COALESCE($5, data_lancamento)
             WHERE id = $6
             RETURNING *`,
            [descricao, valor, mao_obra_id, maquina_id, data_lancamento, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Centro de custo não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /centro-custos/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar centro de custo' });
    }
});

// DELETE /:id – Delete a cost center
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM centro_custos WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Centro de custo não encontrado' });
        res.json({ message: 'Centro de custo removido com sucesso', id: result.rows[0].id });
    } catch (err) {
        console.error('DELETE /centro-custos/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao remover centro de custo' });
    }
});

module.exports = router;
