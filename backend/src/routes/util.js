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
const tabelaCfopsPath = path.join(__dirname, '..', 'utils', 'TABELA CFOPS.xlsx');
let tabelaCfopsCache = null;
const tabelaNbsPath = path.join(__dirname, '..', 'utils', 'TABELA NBS.xlsx');
let tabelaNbsCache = null;

utilRouter.use(ensureAuth);

utilRouter.get('/by-ncm/:ncmId', async (req, res) => {
  const ncmId = Number(req.params.ncmId);
  const rows = await prisma.util.findMany({ where: { ncmId } });
  res.json(rows);
});

// Serve parsed TABELA CFOPS as JSON
utilRouter.get('/tabela-cfops', async (req, res) => {
  try {
    if (!tabelaCfopsCache) {
      if (!fs.existsSync(tabelaCfopsPath)) {
        console.error('Arquivo TABELA CFOPS não encontrado em', tabelaCfopsPath);
        return res.status(404).json({ error: 'Arquivo TABELA CFOPS não encontrado no servidor' });
      }
      const fileBuffer = fs.readFileSync(tabelaCfopsPath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames && workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : null;
      if (!sheet) {
        console.error('Nenhuma planilha encontrada em', tabelaCfopsPath);
        return res.status(500).json({ error: 'Nenhuma planilha encontrada no arquivo' });
      }
      const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
      const normalize = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      // try to find header row that contains CFOP and description-like header
      let headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => typeof cell === 'string' && normalize(cell).includes('cfop')) && row.some(cell => typeof cell === 'string' && normalize(cell).includes('descr')));
      if (headerRowIndex === -1) {
        // fallback: find row with 'cfop' or second column maybe numeric
        headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => typeof cell === 'string' && normalize(cell).includes('cfop')));
      }
      if (headerRowIndex === -1) {
        headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''));
      }
      if (headerRowIndex === -1) {
        tabelaCfopsCache = [];
      } else {
        const headers = raw[headerRowIndex].map(h => h ? String(h).trim() : '');
        const dataRows = raw.slice(headerRowIndex + 1);
        tabelaCfopsCache = dataRows.map((rarr) => {
          const obj = {};
          headers.forEach((h, idx) => {
            const val = (Array.isArray(rarr) ? (rarr[idx] === undefined ? null : rarr[idx]) : null);
            const keyBase = h ? normalize(h).replace(/\s+/g, '_') : `col_${idx}`;
            // map group headers first
            if (keyBase.includes('grupo')) {
              obj['grupo_cfop'] = val;
            // map code-like headers (COD_CFOP, COD, CFOP, etc.) to 'codigo'
            } else if (keyBase.includes('cod') || keyBase === 'cfop' || keyBase === 'codigo') {
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

    res.json({ rows: tabelaCfopsCache });
  } catch (err) {
    console.error('Erro ao ler TABELA CFOPS:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Erro ao ler tabela CFOPS', detail: err && err.message ? err.message : String(err) });
  }
});

// Serve parsed TABELA NBS as JSON
utilRouter.get('/tabela-nbs', async (req, res) => {
  try {
    if (!tabelaNbsCache) {
      if (!fs.existsSync(tabelaNbsPath)) {
        console.error('Arquivo TABELA NBS não encontrado em', tabelaNbsPath);
        return res.status(404).json({ error: 'Arquivo TABELA NBS não encontrado no servidor' });
      }
      const fileBuffer = fs.readFileSync(tabelaNbsPath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames && workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : null;
      if (!sheet) {
        console.error('Nenhuma planilha encontrada em', tabelaNbsPath);
        return res.status(500).json({ error: 'Nenhuma planilha encontrada no arquivo' });
      }
      const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
      const normalize = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      // try to find header row by common headers
      let headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => typeof cell === 'string' && (normalize(cell).includes('item') || normalize(cell).includes('item_lc') || normalize(cell).includes('item_lc_116'))) );
      if (headerRowIndex === -1) {
        headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''));
      }
      if (headerRowIndex === -1) {
        tabelaNbsCache = [];
      } else {
        const rawHeaders = raw[headerRowIndex].map(h => h === undefined || h === null ? '' : String(h));
        // normalize headers: trim, replace NBSPs, remove diacritics and lowercase
        const headers = rawHeaders.map(h => String(h).replace(/\u00A0/g, ' ').trim());
        const normHeaders = headers.map(h => normalize(h).replace(/\s+/g, '_'));
        const dataRows = raw.slice(headerRowIndex + 1);
        tabelaNbsCache = dataRows.map((rarr) => {
          const obj = {};
          headers.forEach((h, idx) => {
            const val = (Array.isArray(rarr) ? (rarr[idx] === undefined ? null : rarr[idx]) : null);
            const nh = normHeaders[idx] || `col_${idx}`;
            // Prepare a friendly form for matching (replace underscores with spaces)
            const nhSpace = nh.replace(/_/g, ' ');

            // Exact/priority mappings based on requested canonical names
            const isItemExact = nh === 'item_lc_116' || nhSpace === 'item lc 116' || (nh.includes('item') && (nh.includes('lc') || nh.includes('116')));
            const isDescricaoItem = nh === 'descricao_item' || nhSpace === 'descricao item' || nhSpace === 'descricao do item' || nhSpace === 'descricao do item';
            const isNbs = nh === 'nbs' || nhSpace === 'nbs';
            const isDescricaoNbs = nh === 'descricao_nbs' || nhSpace === 'descricao nbs' || nhSpace === 'descricao do nbs';

            if (isItemExact) {
              obj['item_lc_116'] = val;
            } else if (isDescricaoItem) {
              obj['descricao_item'] = val;
            } else if (isNbs) {
              obj['nbs'] = val;
            } else if (isDescricaoNbs) {
              obj['descricao_nbs'] = val;
            } else {
              // fallback heuristics: if header contains key words
              if (nh.includes('nbs')) obj['nbs'] = val;
              else if (nh.includes('item')) obj['item_lc_116'] = val;
              else if (nh.includes('descricao') && nh.includes('nbs')) obj['descricao_nbs'] = val;
              else if (nh.includes('descricao') && nh.includes('item')) obj['descricao_item'] = val;
              else if (nh.includes('descricao')) {
                // pick descricao_item by default
                obj['descricao_item'] = val;
              } else {
                obj[nh] = val;
              }
            }
          });
          return obj;
        });
      }
    }

    res.json({ rows: tabelaNbsCache });
  } catch (err) {
    console.error('Erro ao ler TABELA NBS:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Erro ao ler tabela NBS', detail: err && err.message ? err.message : String(err) });
  }
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
