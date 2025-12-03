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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0b0b0b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0b0b0b; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #333; }
          .header { background: #a8892a; color: #0b0b0b; padding: 8px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .header img { max-width: 160px; height: auto; margin: 0; display: inline-block; vertical-align: middle; }
          .content { padding: 32px 24px; color: #ffffff; line-height: 1.6; }
          .protocol { background: #1a1a1a; border-left: 4px solid #a8892a; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 16px; font-weight: 600; color: #a8892a; }
          .message-box { background: #1a1a1a; padding: 16px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap; font-size: 14px; color: #cccccc; border: 1px solid #333; }
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
            <h2 style="color: #a8892a; margin-top: 0;">Confirmação de Recebimento</h2>
            <p>Olá,</p>
            <p>Recebemos sua dúvida com sucesso. Anote o número do seu protocolo:</p>
            <div class="protocol">Protocolo: ${protocol}</div>
            <p>Em breve nossa equipe retornará para o e-mail informado. Agradecemos pelo contato!</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
            <p><strong>Sua mensagem:</strong></p>
            <div class="message-box">${message}</div>
          </div>
          <div class="footer">
            <strong>Parametrize</strong> — Soluções Fiscais<br/>
            Dúvidas? Entre em contato conosco.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: `Confirmação de Recebimento - Protocolo ${protocol} - Parametrize`,
      html: userHtml,
      attachments,
    });

    // notify support inbox
    const supportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0b0b0b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0b0b0b; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #333; }
          .header { background: #a8892a; color: #0b0b0b; padding: 8px 24px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
          .header img { max-width: 160px; height: auto; margin: 0; display: inline-block; vertical-align: middle; }
          .content { padding: 24px; color: #ffffff; line-height: 1.6; }
          .info { background: #1a1a1a; padding: 12px; margin: 12px 0; border-radius: 4px; border-left: 4px solid #a8892a; }
          .message-box { background: #1a1a1a; padding: 16px; margin: 16px 0; border-radius: 4px; white-space: pre-wrap; font-size: 14px; color: #cccccc; border: 1px solid #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${attachments.length ? '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><img src="cid:logo" alt="Parametrize" width="160" style="width: 160px !important; max-width: 160px !important; height: auto; display: block;" /></td></tr></table><p style="margin: 8px 0 0 0; font-size: 14px;">🔔 Nova Dúvida Recebida</p>' : '<h1>🔔 Nova Dúvida Recebida</h1>'}
          </div>
          <div class="content">
            <div class="info">
              <p style="margin: 4px 0;"><strong>Protocolo:</strong> ${protocol}</p>
              <p style="margin: 4px 0;"><strong>De:</strong> ${email} ${userId ? `(userId: ${userId})` : ''}</p>
            </div>
            <p><strong>Mensagem:</strong></p>
            <div class="message-box">${message}</div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Responda diretamente para o e-mail do usuário: <a href="mailto:${email}" style="color: #a8892a;">${email}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({ from, to: supportTo, subject: `Nova Dúvida - ${protocol} - Parametrize`, html: supportHtml, replyTo: email });

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
