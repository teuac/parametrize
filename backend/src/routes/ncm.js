import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth } from '../middlewares/auth.js';
const prisma = new PrismaClient();
export const ncmRouter = Router();

ncmRouter.use(ensureAuth);

ncmRouter.get('/', async (req, res) => {
  const { q } = req.query; // busca por código ou descrição
  const where = q ? {
    OR: [
      { codigo: { contains: String(q), mode: 'insensitive' } },
      { descricao: { contains: String(q), mode: 'insensitive' } },
    ],
  } : {};
  const items = await prisma.ncm.findMany({ where, take: 50, orderBy: { codigo: 'asc' } });
  res.json(items);
});

// admin somente
import { ensureAdmin } from '../middlewares/auth.js';
ncmRouter.post('/', ensureAdmin, async (req, res) => {
  const item = await prisma.ncm.create({ data: req.body });
  res.status(201).json(item);
});
ncmRouter.put('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const item = await prisma.ncm.update({ where: { id }, data: req.body });
  res.json(item);
});
ncmRouter.delete('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.ncm.delete({ where: { id } });
  res.json({ ok: true });
});
