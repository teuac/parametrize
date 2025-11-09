import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const positionRouter = Router();

positionRouter.use(ensureAuth);

// List all positions
positionRouter.get('/', async (req, res) => {
  try {
    const rows = await prisma.position.findMany({ orderBy: { position_code: 'asc' } });
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar posições', err);
    res.status(500).json({ error: 'Erro ao listar posições' });
  }
});

// Get single position by id
positionRouter.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await prisma.position.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: 'Posição não encontrada' });
    res.json(row);
  } catch (err) {
    console.error('Erro ao buscar posição', err);
    res.status(500).json({ error: 'Erro ao buscar posição' });
  }
});

// Admin: create
positionRouter.post('/', ensureAdmin, async (req, res) => {
  try {
    const data = req.body;
    const created = await prisma.position.create({ data });
    res.status(201).json(created);
  } catch (err) {
    console.error('Erro ao criar posição', err);
    res.status(500).json({ error: 'Erro ao criar posição' });
  }
});

// Admin: update
positionRouter.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const updated = await prisma.position.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar posição', err);
    res.status(500).json({ error: 'Erro ao atualizar posição' });
  }
});

// Admin: delete
positionRouter.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.position.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir posição', err);
    res.status(500).json({ error: 'Erro ao excluir posição' });
  }
});

export default positionRouter;
