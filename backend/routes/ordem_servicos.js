'use strict';

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET / – List all service orders
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT os.*, g.nome AS gleba_nome
             FROM ordem_servicos os
             LEFT JOIN glebas g ON os.gleba_id = g.id
             ORDER BY os.id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /ordem-servicos error:', err.message);
        res.status(500).json({ error: 'Erro ao buscar ordens de serviço' });
    }
});

// POST / – Create a new service order
router.post('/', async (req, res) => {
    try {
        const { descricao, valor, gleba_id, data_servico } = req.body;
        if (!descricao) return res.status(400).json({ error: 'descricao é obrigatória' });

        const result = await pool.query(
            `INSERT INTO ordem_servicos (descricao, valor, gleba_id, data_servico)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [descricao, valor || 0, gleba_id || null, data_servico || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /ordem-servicos error:', err.message);
        res.status(500).json({ error: 'Erro ao criar ordem de serviço' });
    }
});

// PUT /:id – Update a service order
router.put('/:id', async (req, res) => {
    try {
        const { descricao, valor, gleba_id, data_servico } = req.body;
        const result = await pool.query(
            `UPDATE ordem_servicos
             SET descricao   = COALESCE($1, descricao),
                 valor       = COALESCE($2, valor),
                 gleba_id    = COALESCE($3, gleba_id),
                 data_servico = COALESCE($4, data_servico)
             WHERE id = $5
             RETURNING *`,
            [descricao, valor, gleba_id, data_servico, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /ordem-servicos/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar ordem de serviço' });
    }
});

// DELETE /:id – Delete a service order
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM ordem_servicos WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
        res.json({ message: 'Ordem de serviço removida com sucesso', id: result.rows[0].id });
    } catch (err) {
        console.error('DELETE /ordem-servicos/:id error:', err.message);
        res.status(500).json({ error: 'Erro ao remover ordem de serviço' });
    }
});

module.exports = router;
