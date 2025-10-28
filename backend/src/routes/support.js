import { Router } from 'express';
import nodemailer from 'nodemailer';

export const supportRouter = Router();

// POST /support -> send support question to parametrizesf@gmail.com
supportRouter.post('/', async (req, res) => {
  const { email, message } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email e mensagem são obrigatórios' });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@parametrize.com';
    const to = process.env.SUPPORT_EMAIL || 'parametrizesf@gmail.com';

    const html = `
      <p>Nova dúvida enviada pelo formulário de ajuda:</p>
      <p><strong>De:</strong> ${email}</p>
      <p><strong>Mensagem:</strong></p>
      <div style="white-space: pre-wrap;">${message}</div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject: 'Nova dúvida - Parametrize',
      html,
      replyTo: email, // so replies go to the user's email
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error sending support email', err);
    return res.status(500).json({ error: 'Erro ao enviar a mensagem' });
  }
});

export default supportRouter;
