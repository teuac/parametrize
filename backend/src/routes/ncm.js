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
    // if client asks to skip logging (already shown), honor that early
    const skipLog = String(req.query?.skipLog || '').toLowerCase() === 'true' || req.headers['x-skip-searchlog'] === '1';
    const userId = req.user?.id;
    // If this is a search (q provided) and the user is not admin and logging is not skipped, enforce quota (daily or package or monthly)
    if (q && req.user?.role !== 'admin' && !skipLog) {
      try {
        // fetch user quota fields once and reuse below
        var userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { dailySearchLimit: true, quotaType: true, packageRemaining: true, packageLimit: true, monthlyRemaining: true, monthlyLimit: true, monthlyRenewalDay: true, lastMonthlyRenewal: true } });
        const quotaType = String(userRecord?.quotaType || 'DAILY').toUpperCase();
        
        if (quotaType === 'MONTHLY') {
          // Check if monthly quota needs renewal
          const today = new Date();
          const currentDay = today.getDate();
          let needsRenewal = false;
          
          if (userRecord.lastMonthlyRenewal) {
            const daysSinceLastRenewal = Math.floor((today - new Date(userRecord.lastMonthlyRenewal)) / (1000 * 60 * 60 * 24));
            if (daysSinceLastRenewal >= 25 && currentDay >= userRecord.monthlyRenewalDay) {
              needsRenewal = true;
            } else if (currentDay === userRecord.monthlyRenewalDay) {
              needsRenewal = true;
            }
          } else {
            needsRenewal = true;
          }
          
          if (needsRenewal) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                monthlyRemaining: userRecord.monthlyLimit || 0,
                lastMonthlyRenewal: today
              }
            });
            userRecord.monthlyRemaining = userRecord.monthlyLimit || 0;
          }
          
          const remaining = Number(userRecord?.monthlyRemaining || 0);
          const limit = Number(userRecord?.monthlyLimit || 0);
          if (remaining <= 0) {
            return res.status(429).json({ error: 'Limite de consultas mensais esgotado', limit, remaining });
          }
        } else if (quotaType === 'PACKAGE') {
          const remaining = Number(userRecord?.packageRemaining || 0);
          const limit = Number(userRecord?.packageLimit || 0);
          if (remaining <= 0) {
            return res.status(429).json({ error: 'Limite de consultas por pacote esgotado', limit, remaining });
          }
        } else {
          const limit = Number(userRecord?.dailySearchLimit ?? 100);
          const startOfDay = new Date();
          startOfDay.setHours(0,0,0,0);
          const used = await prisma.searchLog.count({ where: { userId, createdAt: { gte: startOfDay } } });
          if (used >= limit) {
            return res.status(429).json({ error: 'Limite diário de buscas atingido', limit, used });
          }
        }
      } catch (err) {
        console.error('Erro ao verificar cota de buscas', err);
        // don't block search on quota check failure — allow it
      }
    }

    // Se não houver termo de busca, traz os primeiros 50
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

    // If this was a real search and logging isn't skipped, for PACKAGE/MONTHLY quotas perform an atomic decrement synchronously
    // so the client can be informed immediately. For DAILY quotas we keep the non-blocking async logging behavior.
    if (q && req.user?.role !== 'admin' && !skipLog) {
      try {
        const userIdNum = Number(req.user.id);
        const quotaType = String(userRecord?.quotaType || 'DAILY').toUpperCase();
        
        if (quotaType === 'MONTHLY') {
          // attempt to decrement monthlyRemaining atomically and create SearchLog synchronously if successful
          const upd = await prisma.user.updateMany({ where: { id: userIdNum, monthlyRemaining: { gt: 0 } }, data: { monthlyRemaining: { decrement: 1 } } });
          if (upd && upd.count && upd.count > 0) {
            await prisma.searchLog.create({ data: { userId: userIdNum, query: String(q).trim() } });
            // compute new remaining for header
            const newRemaining = Math.max(0, Number(userRecord.monthlyRemaining || 0) - 1);
            res.set('x-quota-remaining', String(newRemaining));
          } else {
            console.warn('Monthly decrement failed (race condition or limit hit)');
          }
        } else if (quotaType === 'PACKAGE') {
          // attempt to decrement packageRemaining atomically and create SearchLog synchronously if successful
          const upd = await prisma.user.updateMany({ where: { id: userIdNum, packageRemaining: { gt: 0 } }, data: { packageRemaining: { decrement: 1 } } });
          if (upd && upd.count && upd.count > 0) {
            await prisma.searchLog.create({ data: { userId: userIdNum, query: String(q).trim() } });
            // compute new remaining for header
            const newRemaining = Math.max(0, Number(userRecord.packageRemaining || 0) - 1);
            res.set('x-quota-remaining', String(newRemaining));
          } else {
            // no package remaining — nothing to log (should have been blocked earlier)
          }
        }
      } catch (err) {
        console.error('Erro ao decrementar pacote/logar para cota PACKAGE:', err);
      }
    }

    res.json(items);

    // Log the search for DAILY quotas (do not block response if logging fails)
    if (q && req.user?.role !== 'admin' && !skipLog) {
      (async () => {
        try {
          const qRaw = String(q).trim();
          const userIdNum = Number(req.user.id);
          const u = await prisma.user.findUnique({ where: { id: userIdNum }, select: { quotaType: true } });
          if (u && String(u.quotaType).toUpperCase() === 'PACKAGE') {
            // already handled synchronously above
          } else {
            await prisma.searchLog.create({ data: { userId: userIdNum, query: qRaw } });
          }
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
