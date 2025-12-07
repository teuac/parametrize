import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
export const usersRouter = Router();

usersRouter.use(ensureAuth, ensureAdmin);

usersRouter.get('/', async (_, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, blocked: true, createdAt: true, cpfCnpj: true, adesao: true, telefone: true, activeUpdatedAt: true, dailySearchLimit: true, quotaType: true, packageLimit: true, packageRemaining: true } });
  // expose legacy `blocked` and the new `isBlocked` alias in the API
  const out = users.map(u => ({ ...u, isBlocked: u.blocked }));
  res.json(out);
});

usersRouter.post('/', async (req, res) => {
  try {
    // accept both `blocked` and `isBlocked` from the client for compatibility
    const { name, email, password, role = Role.user, active = true, blocked = false, isBlocked, cpfCnpj, telefone, dailySearchLimit = 100, quotaType = 'DAILY', packageLimit = 0, packageRemaining } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: `O email "${email}" já está cadastrado no sistema` });
    }

    // Check if CPF/CNPJ already exists (if provided)
    if (cpfCnpj && cpfCnpj.trim()) {
      const existingCpf = await prisma.user.findFirst({ where: { cpfCnpj: cpfCnpj.trim() } });
      if (existingCpf) {
        return res.status(400).json({ error: `O CPF/CNPJ "${cpfCnpj}" já está cadastrado no sistema` });
      }
    }

    const finalBlocked = typeof isBlocked !== 'undefined' ? Boolean(isBlocked) : Boolean(blocked);
    const plainPassword = password; // keep plain password to include in email
    const hash = await bcrypt.hash(password, 10);
    // adesao will be set by Prisma default(now())
    // if packageRemaining not provided but packageLimit is, initialize remaining to packageLimit
    const pkgRem = typeof packageRemaining !== 'undefined' ? Number(packageRemaining) : (Number(packageLimit) || 0);
    const user = await prisma.user.create({ data: { name, email, password: hash, role, active, blocked: finalBlocked, cpfCnpj, telefone, activeUpdatedAt: active ? new Date() : null, dailySearchLimit, quotaType, packageLimit: Number(packageLimit || 0), packageRemaining: pkgRem } });

  // Send welcome email with access data. Await to ensure it's sent before responding (like other email endpoints).
  try {
    console.log('[EMAIL] Attempting to send welcome email to:', user.email);
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@parametrize.com';
    // sanitize FRONTEND_URL to avoid embedding unintended subpaths (like /login)
    const rawFrontend = (process.env.FRONTEND_URL || 'https://www.app.parametrize.cloud').replace(/\/+$/, '');
    const frontendUrl = rawFrontend.replace(/\/login$/i, '') || 'https://www.app.parametrize.cloud';

    // Read logo if available
    let attachments = [];
    try {
      const logoPath = path.resolve(process.cwd(), 'src', 'utils', 'logo.png');
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
          .credentials { background: #1a1a1a; border-left: 4px solid #a8892a; padding: 16px; margin: 20px 0; border-radius: 4px; }
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
            <h2 style="color: #a8892a; margin-top: 0;">Bem-vindo(a) à Plataforma!</h2>
            <p>Olá <strong>${user.name || ''}</strong>,</p>
            <p>Sua conta foi criada com sucesso. Utilize os dados abaixo para acessar a plataforma:</p>
            <div class="credentials">
              <p style="margin: 8px 0;"><strong>E-mail:</strong> ${user.email}</p>
              <p style="margin: 8px 0;"><strong>Senha:</strong> ${plainPassword || '(definida)'}</p>
            </div>
            <p>Clique no botão abaixo para acessar:</p>
            <div style="text-align: center;">
              <a href="${frontendUrl}" class="button">Acessar Plataforma</a>
            </div>
            <p style="font-size: 13px; color: #666;">Ou acesse diretamente: <a href="${frontendUrl}" style="color: #a8892a;">${frontendUrl}</a></p>
            <p>Recomendamos que você altere sua senha no primeiro acesso.</p>
          </div>
          <div class="footer">
            <strong>Parametrize</strong> — Soluções Fiscais<br/>
            Este é um e-mail automático. Por favor, não responda.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({ from, to: user.email, subject: 'Bem-vindo(a) - Acesso à Plataforma Parametrize', html, attachments });
    console.log('[EMAIL] Welcome email sent successfully to:', user.email);
  } catch (err) {
    console.error('[EMAIL] ❌ Error sending welcome email to', user.email);
    console.error('[EMAIL] Error details:', {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode
    });
    // Don't block user creation on email failure, just log the error
  }

  res.status(201).json({ id: user.id });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === 'P2002') {
      // Prisma unique constraint violation
      const field = err.meta?.target?.[0] || 'campo';
      return res.status(400).json({ error: `O ${field} informado já está cadastrado no sistema` });
    }
    res.status(500).json({ error: err.message || 'Erro ao criar usuário' });
  }
});

usersRouter.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const incoming = { ...req.body };

    // Check if email is being changed and if it's already taken by another user
    if (incoming.email) {
      const existingEmail = await prisma.user.findFirst({ 
        where: { 
          email: incoming.email,
          NOT: { id }
        } 
      });
      if (existingEmail) {
        return res.status(400).json({ error: `O email "${incoming.email}" já está cadastrado no sistema` });
      }
    }

    // Check if CPF/CNPJ is being changed and if it's already taken by another user
    if (incoming.cpfCnpj && incoming.cpfCnpj.trim()) {
      const existingCpf = await prisma.user.findFirst({ 
        where: { 
          cpfCnpj: incoming.cpfCnpj.trim(),
          NOT: { id }
        } 
      });
      if (existingCpf) {
        return res.status(400).json({ error: `O CPF/CNPJ "${incoming.cpfCnpj}" já está cadastrado no sistema` });
      }
    }

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

    // handle quota fields: ensure numeric types and initialize packageRemaining when packageLimit provided but remaining not
    if (typeof incoming.packageLimit !== 'undefined') {
      incoming.packageLimit = Number(incoming.packageLimit || 0);
      if (typeof incoming.packageRemaining === 'undefined') {
        incoming.packageRemaining = incoming.packageLimit;
      } else {
        incoming.packageRemaining = Number(incoming.packageRemaining || 0);
      }
    }
    if (typeof incoming.dailySearchLimit !== 'undefined') incoming.dailySearchLimit = Number(incoming.dailySearchLimit || 0);

    await prisma.user.update({ where: { id }, data: incoming });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.code === 'P2002') {
      // Prisma unique constraint violation
      const field = err.meta?.target?.[0] || 'campo';
      return res.status(400).json({ error: `O ${field} informado já está cadastrado no sistema` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: err.message || 'Erro ao atualizar usuário' });
  }
});

usersRouter.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: err.message || 'Erro ao deletar usuário' });
  }
});
