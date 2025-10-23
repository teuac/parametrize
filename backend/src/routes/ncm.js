import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth } from '../middlewares/auth.js';
const prisma = new PrismaClient();
export const ncmRouter = Router();

ncmRouter.use(ensureAuth);

ncmRouter.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const items = await prisma.ncm.findMany({
        include: { classTrib: true },
        take: 50,
        orderBy: { codigo: "asc" },
      });
      return res.json(items);
    }

    const query = String(q).replace(/\./g, ""); // remove pontos da busca

const items = await prisma.$queryRaw`
  SELECT 
    n.*, 
    json_build_object(
      'codigoClassTrib', c."codigoClassTrib",
      'cstIbsCbs', c."cstIbsCbs",
      'descricaoCstIbsCbs', c."descricaoCstIbsCbs",
      'descricaoClassTrib', c."descricaoClassTrib",
      'pRedIBS', c."pRedIBS",
      'pRedCBS', c."pRedCBS",
      'link', c."link"
    ) AS "classTrib"
  FROM "Ncm" n
  LEFT JOIN "ClassTrib" c 
    ON n."cClasstrib" = c."codigoClassTrib"
  WHERE 
    (
      REPLACE(n."codigo", '.', '') ILIKE ${`${query}%`}   -- 🔹 começa com
      OR n."descricao" ILIKE ${`${query}%`}              -- 🔹 começa com
      OR REPLACE(n."codigo", '.', '') ILIKE ${`%${query}%`}  -- 🔹 contém
      OR n."descricao" ILIKE ${`%${query}%`}                 -- 🔹 contém
    )
  ORDER BY
    SUBSTRING(REPLACE(n."codigo", '.', '') FROM 1 FOR 2)::int ASC,  -- 🔹 ordena pelos 2 primeiros dígitos
    n."codigo" ASC
  LIMIT 50;
`;
    res.json(items);
  } catch (err) {
    console.error("❌ Erro ao buscar NCM:", err);
    res.status(500).json({ error: "Erro ao buscar NCMs" });
  }
});


// admin somente
import { ensureAdmin } from '../middlewares/auth.js';
ncmRouter.post('/', ensureAdmin, async (req, res) => {
  const item = await prisma.ncm.create({ data: req.body });
  res.status(201).json(item);
});
ncmRouter.put('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const item = await prisma.ncm.update({ where: { id }, data: req.body });
  res.json(item);
});
ncmRouter.delete('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.ncm.delete({ where: { id } });
  res.json({ ok: true });
});
