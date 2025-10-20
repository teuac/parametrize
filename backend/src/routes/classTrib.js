import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';
const prisma = new PrismaClient();
export const classTribRouter = Router();

classTribRouter.use(ensureAuth);

// listar por NCM
classTribRouter.get('/by-ncm/:ncmId', async (req, res) => {
  const ncmId = Number(req.params.ncmId);
  const rows = await prisma.classTrib.findMany({ where: { ncmId } });
  res.json(rows);
});

classTribRouter.post('/', ensureAdmin, async (req, res) => {
  const row = await prisma.classTrib.create({ data: req.body });
  res.status(201).json(row);
});
classTribRouter.put('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const row = await prisma.classTrib.update({ where: { id }, data: req.body });
  res.json(row);
});
classTribRouter.delete('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.classTrib.delete({ where: { id } });
  res.json({ ok: true });
});
