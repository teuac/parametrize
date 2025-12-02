import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
    const rawFrontend = (process.env.FRONTEND_URL || 'https://www.app.parametrize.cloud').replace(/\/+$/, '');
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

    // Read logo if available
    let attachments = [];
    try {
      const logoPath = path.resolve(__dirname, '..', 'utils', 'logo.png');
      console.log('[EMAIL] Logo path:', logoPath);
      console.log('[EMAIL] Logo exists:', fs.existsSync(logoPath));
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        console.log('[EMAIL] Logo buffer size:', logoBuffer.length, 'bytes');
        attachments.push({ filename: 'logo.png', content: logoBuffer, cid: 'logo' });
      } else {
        console.log('[EMAIL] Logo file not found at:', logoPath);
      }
    } catch (e) {
      console.error('[EMAIL] Error reading logo:', e?.message || e);
    }
    console.log('[EMAIL] Attachments count:', attachments.length);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0b0b0b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0b0b0b; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #333; }
          .header { background: #a8892a; color: #0b0b0b; padding: 8px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .header img { max-width: 32px; height: auto; margin: 0; display: inline-block; vertical-align: middle; }
          .content { padding: 32px 24px; color: #ffffff; line-height: 1.6; }
          .button { display: inline-block; margin: 20px 0; padding: 14px 28px; background: #a8892a; color: #0b0b0b; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { background: #1a1a1a; padding: 20px 24px; text-align: center; font-size: 12px; color: #cccccc; border-top: 1px solid #333; }
          .footer strong { color: #a8892a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${attachments.length ? '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><img src="cid:logo" alt="Parametrize" width="160" style="width: 160px !important; max-width: 160px !important; height: auto; display: block;" /></td></tr></table>' : '<h1>Parametrize</h1>'}
            <p style="margin: 8px 0 0 0; font-size: 14px;">Soluções Fiscais</p>
          </div>
          <div class="content">
            <h2 style="color: #a8892a; margin-top: 0;">Recuperação de Senha</h2>
            <p>Olá,</p>
            <p>Você solicitou a recuperação de senha. Clique no botão abaixo para criar uma nova senha (válido por 1 hora):</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Redefinir Senha</a>
            </div>
            <p style="font-size: 13px; color: #666;">Ou copie e cole este link no navegador:<br/><a href="${resetLink}" style="color: #a8892a; word-break: break-all;">${resetLink}</a></p>
            <p>Se você não solicitou esta recuperação, ignore esta mensagem. Sua senha permanecerá inalterada.</p>
          </div>
          <div class="footer">
            <strong>Parametrize</strong> — Soluções Fiscais<br/>
            Este é um e-mail automático. Por favor, não responda.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({ from, to: user.email, subject: 'Recuperação de senha - Parametrize', html, attachments });
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
