import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function ensureAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token ausente' });
  const [, token] = auth.split(' ');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // verify user still exists and is not blocked
    let user;
    try {
      user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, blocked: true } });
    } catch (dbErr) {
      console.error('Database error in ensureAuth:', dbErr);
      return res.status(500).json({ error: 'Erro no servidor: talvez seja necessário aplicar migrations (prisma). Contate o administrador.' });
    }
    if (!user) return res.status(401).json({ error: 'Token inválido' });
    if (user.blocked) return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o administrador do sistema.' });
    req.user = payload; // { id, role, email }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function ensureAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  next();
}
