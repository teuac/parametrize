import jwt from 'jsonwebtoken';

export function ensureAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token ausente' });
  const [, token] = auth.split(' ');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, email }
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function ensureAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  next();
}
