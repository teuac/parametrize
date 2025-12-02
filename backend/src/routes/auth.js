import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
const prisma = new PrismaClient();

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Credenciais inválidas' });

  // Check if user is active
  if (user.active === false) {
    return res.status(403).json({ error: 'Conta inativa. Entre em contato com o administrador do sistema.' });
  }

  // Check if user is blocked
  if (user.blocked === true) {
    return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o administrador do sistema.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  // include `isBlocked` alias for API clients
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, active: user.active, blocked: user.blocked, isBlocked: user.blocked } });
});

// POST /auth/forgot -> send password reset link (if user exists)
authRouter.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond 200 to avoid account enumeration
  if (!user) return res.json({ ok: true });

  try {
    // create a short-lived token for password reset
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // sanitize FRONTEND_URL: remove trailing slash and accidental '/login' suffix
    const rawFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const frontendUrl = rawFrontend.replace(/\/login$/i, '');
    const resetLink = `${frontendUrl}/recover/reset?token=${encodeURIComponent(token)}`;

    // configure nodemailer transport using env vars
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const from = process.env.EMAIL_FROM || 'no-reply@parametrize.com';

    const html = `
      <p>Você solicitou a recuperação de senha. Clique no link abaixo para criar uma nova senha (válido 1 hora):</p>
      <p><a href="${resetLink}">Redefinir senha</a></p>
      <p>Se você não solicitou, ignore esta mensagem.</p>
    `;

    await transporter.sendMail({ from, to: user.email, subject: 'Recuperação de senha', html });
  } catch (err) {
    console.error('Error sending forgot email', err);
    // Do not reveal error to client
  }

  return res.json({ ok: true });
});

// POST /auth/reset -> reset password using token
authRouter.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token e senha são obrigatórios' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id;
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
});

// POST /auth/change -> change password for authenticated user (requires Authorization header)
authRouter.post('/change', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Não autorizado' });
    const [, token] = auth.split(' ');
    if (!token) return res.status(401).json({ error: 'Token ausente' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ error: 'Token inválido' });
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Senhas antigas e novas são obrigatórias' });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Senha antiga incorreta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error changing password', err);
    return res.status(400).json({ error: 'Erro ao alterar senha' });
  }
});
