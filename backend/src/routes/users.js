import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const usersRouter = Router();

usersRouter.use(ensureAuth, ensureAdmin);

usersRouter.get('/', async (_, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, cpfCnpj: true, adesao: true, telefone: true, activeUpdatedAt: true } });
  res.json(users);
});

usersRouter.post('/', async (req, res) => {
  const { name, email, password, role = Role.user, active = true, cpfCnpj, telefone } = req.body;
  const hash = await bcrypt.hash(password, 10);
  // adesao will be set by Prisma default(now())
  const user = await prisma.user.create({ data: { name, email, password: hash, role, active, cpfCnpj, telefone, activeUpdatedAt: active ? new Date() : null } });
  res.status(201).json({ id: user.id });
});

usersRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const incoming = { ...req.body };
  if (incoming.password) incoming.password = await bcrypt.hash(incoming.password, 10);

  // If active field is being updated, compare with current value and set activeUpdatedAt accordingly
  if (typeof incoming.active !== 'undefined') {
    const existing = await prisma.user.findUnique({ where: { id }, select: { active: true } });
    if (existing && existing.active !== incoming.active) {
      incoming.activeUpdatedAt = new Date();
    }
  }

  await prisma.user.update({ where: { id }, data: incoming });
  res.json({ ok: true });
});

usersRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});
