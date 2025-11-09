import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ensureAuth, ensureAdmin } from "../middlewares/auth.js";

const prisma = new PrismaClient();
export const ncmRouter = Router();

ncmRouter.use(ensureAuth);

/* =====================================================
   🔹 ROTA PRINCIPAL — busca completa (cards)
===================================================== */
ncmRouter.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user?.id;

    // If this is a search (q provided) and the user is not admin, enforce daily quota
    if (q && req.user?.role !== 'admin') {
      try {
        const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { dailySearchLimit: true } });
        const limit = userRecord?.dailySearchLimit ?? 100;
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const used = await prisma.searchLog.count({ where: { userId, createdAt: { gte: startOfDay } } });
        if (used >= limit) {
          return res.status(429).json({ error: 'Limite diário de buscas atingido', limit, used });
        }
      } catch (err) {
        console.error('Erro ao verificar cota de buscas', err);
        // don't block search on quota check failure — allow it
      }
    }

    // If admin requested all items explicitly, return full list (admin only)
    if (req.query.all && String(req.query.all) === '1' && req.user?.role === 'admin') {
      const items = await prisma.ncm.findMany({ include: { classTrib: true }, orderBy: { codigo: 'asc' } });
      return res.json(items);
    }

    // If no search term, return first 50 (regular behaviour)
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
        ) AS "classTrib",
        CASE
          WHEN REPLACE(n."codigo", '.', '') ILIKE ${`${query}%`} THEN 1
          WHEN n."descricao" ILIKE ${`${query}%`} THEN 2
          ELSE 3
        END AS relevance
      FROM "Ncm" n
      LEFT JOIN "ClassTrib" c 
        ON n."cClasstrib" = c."codigoClassTrib"
      WHERE 
        REPLACE(n."codigo", '.', '') ILIKE ${`${query}%`}
        OR n."descricao" ILIKE ${`${query}%`}
      ORDER BY 
        relevance ASC,
        n."codigo" ASC
      LIMIT 50;
    `;

    res.json(items);

    // Log the search (do not block response if logging fails)
    if (q && req.user?.role !== 'admin') {
      (async () => {
        try {
          await prisma.searchLog.create({ data: { userId, query: String(q) } });
        } catch (err) {
          console.error('Erro ao gravar SearchLog', err);
        }
      })();
    }
  } catch (err) {
    console.error("❌ Erro ao buscar NCM:", err);
    res.status(500).json({ error: "Erro ao buscar NCMs" });
  }
});

/* =====================================================
   🔹 ROTA DE SUGESTÕES — autocomplete sem duplicados
===================================================== */
ncmRouter.get("/sugestoes", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const query = String(q).replace(/\./g, "");

    const sugestoes = await prisma.$queryRaw`
      SELECT DISTINCT ON (n."codigo")
        n."codigo",
        n."descricao"
      FROM "Ncm" n
      WHERE 
        REPLACE(n."codigo", '.', '') ILIKE ${`${query}%`}
        OR n."descricao" ILIKE ${`${query}%`}
      ORDER BY n."codigo" ASC
      LIMIT 10;
    `;

    res.json(sugestoes);
  } catch (err) {
    console.error("❌ Erro ao buscar sugestões:", err);
    res.status(500).json({ error: "Erro ao buscar sugestões" });
  }
});

/* =====================================================
   🔹 ROTAS ADMIN — CRUD
===================================================== */
ncmRouter.post("/", ensureAdmin, async (req, res) => {
  const item = await prisma.ncm.create({ data: req.body });
  res.status(201).json(item);
});

ncmRouter.put("/:id", ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const item = await prisma.ncm.update({ where: { id }, data: req.body });
  res.json(item);
});

ncmRouter.delete("/:id", ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.ncm.delete({ where: { id } });
  res.json({ ok: true });
});
