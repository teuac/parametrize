import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as xlsx from 'xlsx';
import fs from 'fs';
const prisma = new PrismaClient();
export const utilRouter = Router();

// helper to locate the Excel file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tabelaNcmsPath = path.join(__dirname, '..', 'utils', 'TABELA NCMS.xlsx');
let tabelaNcmsCache = null;

utilRouter.use(ensureAuth);

utilRouter.get('/by-ncm/:ncmId', async (req, res) => {
  const ncmId = Number(req.params.ncmId);
  const rows = await prisma.util.findMany({ where: { ncmId } });
  res.json(rows);
});

utilRouter.post('/', ensureAdmin, async (req, res) => {
  const row = await prisma.util.create({ data: req.body });
  res.status(201).json(row);
});
utilRouter.put('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const row = await prisma.util.update({ where: { id }, data: req.body });
  res.json(row);
});
utilRouter.delete('/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.util.delete({ where: { id } });
  res.json({ ok: true });
});

// Serve parsed TABELA NCMS as JSON
utilRouter.get('/tabela-ncm', async (req, res) => {
  try {
    // cache in memory to avoid re-reading on every request
    if (!tabelaNcmsCache) {
      if (!fs.existsSync(tabelaNcmsPath)) {
        console.error('Arquivo TABELA NCMS não encontrado em', tabelaNcmsPath);
        return res.status(404).json({ error: 'Arquivo TABELA NCMS não encontrado no servidor' });
      }
      const fileBuffer = fs.readFileSync(tabelaNcmsPath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames && workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : null;
      if (!sheet) {
        console.error('Nenhuma planilha encontrada em', tabelaNcmsPath);
        return res.status(500).json({ error: 'Nenhuma planilha encontrada no arquivo' });
      }
      // sometimes the spreadsheet has title rows before the header; read as arrays
      const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
      // find header row that contains 'codigo' and 'descr' (descricao)
      const normalize = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      let headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => typeof cell === 'string' && normalize(cell).includes('codigo')) && row.some(cell => typeof cell === 'string' && normalize(cell).includes('descr')));
      if (headerRowIndex === -1) {
        // fallback: take the first non-empty row as header
        headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''));
      }
      if (headerRowIndex === -1) {
        // nothing to parse
        tabelaNcmsCache = [];
      } else {
        const headers = raw[headerRowIndex].map(h => h ? String(h).trim() : '');
        const dataRows = raw.slice(headerRowIndex + 1);
        tabelaNcmsCache = dataRows.map((rarr) => {
          const obj = {};
          headers.forEach((h, idx) => {
            const val = (Array.isArray(rarr) ? (rarr[idx] === undefined ? null : rarr[idx]) : null);
            const keyBase = h ? normalize(h).replace(/\s+/g, '_') : `col_${idx}`;
            if (keyBase.includes('codigo') || keyBase === 'codigo' || keyBase === 'cod' || keyBase === 'ncm') {
              obj['codigo'] = val;
            } else if (keyBase.includes('descr')) {
              obj['descricao'] = val;
            } else {
              obj[keyBase] = val;
            }
          });
          return obj;
        });
      }
    }

    res.json({ rows: tabelaNcmsCache });
  } catch (err) {
    console.error('Erro ao ler TABELA NCMS:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Erro ao ler tabela NCM', detail: err && err.message ? err.message : String(err) });
  }
});
