import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const usersRouter = Router();

usersRouter.use(ensureAuth, ensureAdmin);

usersRouter.get('/', async (_, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, blocked: true, createdAt: true, cpfCnpj: true, adesao: true, telefone: true, activeUpdatedAt: true, dailySearchLimit: true } });
  // expose legacy `blocked` and the new `isBlocked` alias in the API
  const out = users.map(u => ({ ...u, isBlocked: u.blocked }));
  res.json(out);
});

usersRouter.post('/', async (req, res) => {
  // accept both `blocked` and `isBlocked` from the client for compatibility
  const { name, email, password, role = Role.user, active = true, blocked = false, isBlocked, cpfCnpj, telefone, dailySearchLimit = 100 } = req.body;
  const finalBlocked = typeof isBlocked !== 'undefined' ? Boolean(isBlocked) : Boolean(blocked);
  const plainPassword = password; // keep plain password to include in email
  const hash = await bcrypt.hash(password, 10);
  // adesao will be set by Prisma default(now())
  const user = await prisma.user.create({ data: { name, email, password: hash, role, active, blocked: finalBlocked, cpfCnpj, telefone, activeUpdatedAt: active ? new Date() : null, dailySearchLimit } });

  // Try to send welcome email with access data. Do not block user creation on email failure.
  (async () => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });

      const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@parametrize.com';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const html = `
        <p>Olá ${user.name || ''},</p>
        <p>Bem-vindo(a) ao sistema. Seus dados de acesso são:</p>
        <ul>
          <li><strong>E-mail:</strong> ${user.email}</li>
          <li><strong>Senha:</strong> ${plainPassword || '(definida)'}</li>
        </ul>
        <p>Você pode acessar a plataforma em <a href="${frontendUrl}">${frontendUrl}</a></p>
        <p>Se você não esperava este e-mail, ignore-o.</p>
      `;

      await transporter.sendMail({ from, to: user.email, subject: 'Bem-vindo(a) - Acesso à plataforma', html });
    } catch (err) {
      console.error('Error sending welcome email', err);
    }
  })();

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

  // allow updating blocked flag as well. accept `isBlocked` alias from client
  if (typeof incoming.isBlocked !== 'undefined') {
    incoming.blocked = Boolean(incoming.isBlocked);
    delete incoming.isBlocked;
  }

  await prisma.user.update({ where: { id }, data: incoming });
  res.json({ ok: true });
});

usersRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});
