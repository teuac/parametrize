import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const usersRouter = Router();

usersRouter.use(ensureAuth, ensureAdmin);

usersRouter.get('/', async (_, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
  res.json(users);
});

usersRouter.post('/', async (req, res) => {
  const { name, email, password, role = Role.user } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash, role } });
  res.status(201).json({ id: user.id });
});

usersRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const data = { ...req.body };
  if (data.password) data.password = await bcrypt.hash(data.password, 10);
  await prisma.user.update({ where: { id }, data });
  res.json({ ok: true });
});


usersRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});
