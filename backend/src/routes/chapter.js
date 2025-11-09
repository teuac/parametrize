import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const chapterRouter = Router();

chapterRouter.use(ensureAuth);

// List all chapters
chapterRouter.get('/', async (req, res) => {
  try {
    const rows = await prisma.chapter.findMany({ orderBy: { chapter_code: 'asc' } });
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar capítulos', err);
    res.status(500).json({ error: 'Erro ao listar capítulos' });
  }
});

// Get single chapter by id
chapterRouter.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await prisma.chapter.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: 'Capítulo não encontrado' });
    res.json(row);
  } catch (err) {
    console.error('Erro ao buscar capítulo', err);
    res.status(500).json({ error: 'Erro ao buscar capítulo' });
  }
});

// Admin: create
chapterRouter.post('/', ensureAdmin, async (req, res) => {
  try {
    const data = req.body;
    const created = await prisma.chapter.create({ data });
    res.status(201).json(created);
  } catch (err) {
    console.error('Erro ao criar capítulo', err);
    res.status(500).json({ error: 'Erro ao criar capítulo' });
  }
});

// Admin: update
chapterRouter.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const updated = await prisma.chapter.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar capítulo', err);
    res.status(500).json({ error: 'Erro ao atualizar capítulo' });
  }
});

// Admin: delete
chapterRouter.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.chapter.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir capítulo', err);
    res.status(500).json({ error: 'Erro ao excluir capítulo' });
  }
});
