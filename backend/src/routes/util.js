import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';
const prisma = new PrismaClient();
export const utilRouter = Router();

utilRouter.use(ensureAuth);

utilRouter.get('/by-ncm/:ncmId', async (req, res) => {
  const ncmId = Number(req.params.ncmId);
  const rows = await prisma.util.findMany({ where: { ncmId } });
  res.json(rows);
});

utilRouter.post('/', ensureAdmin, async (req, res) => {
  const row = await prisma.util.create({ data: req.body });
  res.status(201).json(row);
});
utilRouter.put('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const row = await prisma.util.update({ where: { id }, data: req.body });
  res.json(row);
});
utilRouter.delete('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.util.delete({ where: { id } });
  res.json({ ok: true });
});
