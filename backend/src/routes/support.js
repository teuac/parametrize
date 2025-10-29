import { Router } from 'express';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const supportRouter = Router();

// Helper: try decode token to get user id (optional)
function getUserIdFromAuthHeader(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const [, token] = auth.split(' ');
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.id || null;
  } catch (e) {
    return null;
  }
}

// POST /support -> create support ticket, send confirmation to user and notify support inbox
supportRouter.post('/', async (req, res) => {
  const { email, message } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email e mensagem são obrigatórios' });

  const userId = getUserIdFromAuthHeader(req);

  try {
    // create ticket
    const ticket = await prisma.supportTicket.create({ data: { email, message, userId: userId ? Number(userId) : undefined } });

    // generate protocol using date + id
    const now = new Date();
    const ymd = now.toISOString().slice(0,10).replace(/-/g, '');
    const protocol = `${ymd}-${String(ticket.id).padStart(6, '0')}`;

    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { protocol } });

    // prepare transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@parametrize.com';
    const supportTo = process.env.SUPPORT_EMAIL || 'parametrizesf@gmail.com';

    // read logo if available
    let attachments = [];
    try {
      const logoPath = path.resolve(__dirname, '..', 'utils', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        attachments.push({ filename: 'logo.png', content: logoBuffer, cid: 'logo' });
      }
    } catch (e) {
      console.error('Erro ao ler logo para email:', e && e.message ? e.message : e);
    }

    // send confirmation email to user
    const userHtml = `
      <div style="font-family: Arial, sans-serif; color: #222">
        ${attachments.length ? '<div><img src="cid:logo" style="width:120px;"/></div>' : ''}
        <div style="font-weight:700; margin-top:6px;">Parametrize Solucoes Fiscais</div>
        <p>Recebemos sua dúvida. Seu protocolo é <strong>${protocol}</strong>.</p>
        <p>Em breve nossa equipe retornará para o e-mail informado.</p>
        <hr />
        <p><strong>Mensagem enviada:</strong></p>
        <div style="white-space: pre-wrap;">${message}</div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: `Confirmação de recebimento - Protocolo ${protocol}`,
      html: userHtml,
      attachments,
    });

    // notify support inbox
    const supportHtml = `
      <p>Nova dúvida recebida:</p>
      <p><strong>Protocolo:</strong> ${protocol}</p>
      <p><strong>De:</strong> ${email} ${userId ? `(userId: ${userId})` : ''}</p>
      <p><strong>Mensagem:</strong></p>
      <div style="white-space: pre-wrap;">${message}</div>
    `;

    await transporter.sendMail({ from, to: supportTo, subject: `Nova dúvida - ${protocol}`, html: supportHtml, replyTo: email });

    return res.json({ ok: true, protocol });
  } catch (err) {
    console.error('Error creating support ticket or sending emails', err);
    return res.status(500).json({ error: 'Erro ao processar a dúvida' });
  }
});

// GET /support - admin listing with optional protocol search
supportRouter.get('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const where = q ? { protocol: { contains: q } } : {};
    const tickets = await prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (err) {
    console.error('Error listing support tickets', err);
    res.status(500).json({ error: 'Erro ao listar dúvidas' });
  }
});

// GET /support/:id - admin fetch single ticket
supportRouter.get('/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Dúvida não encontrada' });
    res.json(ticket);
  } catch (err) {
    console.error('Error fetching support ticket', err);
    res.status(500).json({ error: 'Erro ao buscar dúvida' });
  }
});

export default supportRouter;
