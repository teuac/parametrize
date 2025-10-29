import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as xlsx from 'xlsx';
import ExcelJS from 'exceljs';
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

// POST /util/import-ncm
// Accepts JSON { filename, data } where data is base64 XLSX content.
// Returns an XLSX file with additional columns populated from DB lookups for each NCM found.
utilRouter.post('/import-ncm', async (req, res) => {
  try {
    const { filename, data } = req.body || {};
    if (!data) return res.status(400).json({ error: 'Nenhum arquivo enviado (campo data).' });

  const buffer = Buffer.from(data, 'base64');
  const inputWorkbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = inputWorkbook.SheetNames && inputWorkbook.SheetNames[0];
  const sheet = sheetName ? inputWorkbook.Sheets[sheetName] : null;
    if (!sheet) return res.status(400).json({ error: 'Planilha inválida.' });

    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const normalize = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    // find header row index by looking for 'ncm' or 'codigo' and 'descr' presence
    let headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => typeof cell === 'string' && normalize(cell).includes('ncm')));
    if (headerRowIndex === -1) {
      headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => typeof cell === 'string' && (normalize(cell).includes('codigo') || normalize(cell).includes('cod'))));
    }
    if (headerRowIndex === -1) {
      // fallback: first non-empty row
      headerRowIndex = raw.findIndex((row) => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''));
    }
    if (headerRowIndex === -1) return res.status(400).json({ error: 'Não foi possível localizar cabeçalho na planilha.' });

    const headers = raw[headerRowIndex].map(h => h === undefined || h === null ? '' : String(h));
    // determine NCM column index
    const ncmColIndex = headers.findIndex(h => normalize(h).includes('ncm') || normalize(h).includes('codigo'));
    if (ncmColIndex === -1) return res.status(400).json({ error: 'Não foi encontrada coluna NCM na planilha.' });

  // prepare new headers for classTrib fields and insert them immediately after the NCM column
  // place codigoClassTrib after descricaoCstIbsCbs as requested
  // also add Aliquota IBS and Aliquota CBS computed with same logic as Dashboard cards
  const extraCols = ['CST','Descrição','cClassTrib','Descrição ClassTrib','Red IBS','Red CBS','Aliquota IBS','Aliquota CBS','Base Legal - LC 214/25'];
  const insertPos = ncmColIndex + 1; // insert after the NCM column
  const outHeaders = headers.slice(0, insertPos).concat(extraCols).concat(headers.slice(insertPos));

    // build output rows array starting with header
    const outRows = [];
    outRows.push(outHeaders);

      // determine index of the Base Legal column in the output headers (zero-based)
      const baseLegalHeader = 'Base Legal - LC 214/25';
      const baseLegalColIndex = outHeaders.findIndex(h => String(h || '').trim() === baseLegalHeader);

    const dataRows = raw.slice(headerRowIndex + 1);

    // Build a set of unique normalized NCM codes from the sheet (to avoid repeated DB queries)
    const uniqueCodes = new Set();
    const parsedRows = dataRows.map((rowArr) => Array.isArray(rowArr) ? rowArr.slice() : []);
    parsedRows.forEach((row) => {
      const cellVal = row[ncmColIndex];
      const ncmRaw = cellVal === null || cellVal === undefined ? '' : String(cellVal).trim();
      const norm = ncmRaw.replace(/\./g, '').replace(/\s+/g, '');
      if (norm) uniqueCodes.add(norm);
    });

    // Fetch matches for each unique normalized code (one query per unique code)
    const matchesMap = Object.create(null);
    for (const code of Array.from(uniqueCodes)) {
      try {
        const found = await prisma.$queryRaw`
          SELECT c."codigoClassTrib" as "codigoClassTrib",
                 c."cstIbsCbs" as "cstIbsCbs",
                 c."descricaoCstIbsCbs" as "descricaoCstIbsCbs",
                 c."descricaoClassTrib" as "descricaoClassTrib",
                 c."pRedIBS" as "pRedIBS",
                 c."pRedCBS" as "pRedCBS",
                 c."link" as "link"
          FROM "Ncm" n
          LEFT JOIN "ClassTrib" c ON n."cClasstrib" = c."codigoClassTrib"
          WHERE REPLACE(n."codigo",'.','') = ${code};`;
        matchesMap[code] = Array.isArray(found) && found.length ? found : [];
      } catch (err) {
        console.error('Erro ao buscar NCM durante import (batch):', err && err.stack ? err.stack : err);
        matchesMap[code] = [];
      }
    }

    // Build output rows: for each input row, if there are multiple matches, emit multiple rows (one per match)
    for (const row of parsedRows) {
      const cellVal = row[ncmColIndex];
      const ncmRaw = cellVal === null || cellVal === undefined ? '' : String(cellVal).trim();
      const norm = ncmRaw.replace(/\./g, '').replace(/\s+/g, '');

      // build base row values aligned with original headers
      const baseRow = headers.map((_, i) => (row[i] === undefined ? null : row[i]));

      const matches = norm ? (matchesMap[norm] || []) : [];
      if (matches.length) {
        for (const f of matches) {
          const pRedIBS = parseFloat(f.pRedIBS) || 0;
          const pRedCBS = parseFloat(f.pRedCBS) || 0;
          const cst = (f.cstIbsCbs || '').toString();
          const cstZerados = ["400", "410", "510", "550", "620"];
          const isIsento = cstZerados.includes(cst);
          const aliquotaIBS = isIsento ? 0 : 0.1 * (1 - pRedIBS / 100);
          const aliquotaCBS = isIsento ? 0 : 0.9 * (1 - pRedCBS / 100);
          const aliquotaIBSStr = `${aliquotaIBS.toFixed(2)}%`;
          const aliquotaCBSStr = `${aliquotaCBS.toFixed(2)}%`;
          // format Redução values: remove quotes/percent and append '%' for display
          const rawPRedIBS = f.pRedIBS === undefined || f.pRedIBS === null ? '' : String(f.pRedIBS);
          const normPRedIBS = rawPRedIBS.replace(/[%"\s]/g, '').replace(',', '.');
          const pRedIBSDisplay = normPRedIBS === '' ? '' : (isNaN(Number(normPRedIBS)) ? normPRedIBS + '%' : `${parseFloat(normPRedIBS)}%`);

          const rawPRedCBS = f.pRedCBS === undefined || f.pRedCBS === null ? '' : String(f.pRedCBS);
          const normPRedCBS = rawPRedCBS.replace(/[%"\s]/g, '').replace(',', '.');
          const pRedCBSDisplay = normPRedCBS === '' ? '' : (isNaN(Number(normPRedCBS)) ? normPRedCBS + '%' : `${parseFloat(normPRedCBS)}%`);

          const extraVals = [
            f.cstIbsCbs || '',
            f.descricaoCstIbsCbs || '',
            f.codigoClassTrib || '',
            f.descricaoClassTrib || '',
            pRedIBSDisplay,
            pRedCBSDisplay,
            aliquotaIBSStr,
            aliquotaCBSStr,
            f.link || ''
          ];
          // insert the extraVals right after the NCM column
          const outRow = baseRow.slice(0, insertPos).concat(extraVals).concat(baseRow.slice(insertPos));
          outRows.push(outRow);
        }
      } else {
        // no matches — insert empty extra columns after NCM column
        const outRow = baseRow.slice(0, insertPos).concat(['', '', '', '', '', '', '', '', '']).concat(baseRow.slice(insertPos));
        outRows.push(outRow);
      }
    }

    // create a new ExcelJS workbook so we can embed the logo and style the title
    const workbook = new ExcelJS.Workbook();
    const sheetExcel = workbook.addWorksheet(sheetName || 'Sheet1');

    // attempt to insert logo in the top-left if available (bigger size)
    try {
      const logoPath = path.resolve(__dirname, '..', 'utils', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
        // place a larger logo spanning A1:B8 (wider and taller) so it's more prominent
        sheetExcel.addImage(imageId, 'A1:B8');
        // increase row heights for the logo area to accommodate the larger image
        sheetExcel.getRow(1).height = 30;
        sheetExcel.getRow(2).height = 20;
        sheetExcel.getRow(3).height = 20;
        sheetExcel.getRow(4).height = 20;
        sheetExcel.getRow(5).height = 18;
        sheetExcel.getRow(6).height = 18;
        sheetExcel.getRow(7).height = 16;
        sheetExcel.getRow(8).height = 16;
      }
    } catch (e) {
      // ignore image errors
      console.error('Não foi possível inserir logo na planilha:', e && e.message ? e.message : e);
    }

    // Title: merge cells from column after logo (logo now spans two columns) across to last column on row 1
    const totalCols = outHeaders.length;
    const titleColStart = 3; // logo spans A-B now, so title starts at C (immediately to the right)
    if (totalCols >= titleColStart) {
      // place the title on row 4 as requested
      sheetExcel.mergeCells(4, titleColStart, 4, totalCols);
      const titleCell = sheetExcel.getRow(4).getCell(titleColStart);
      titleCell.value = 'Importação de NCMs';
      titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
      // slightly larger title font as requested
      titleCell.font = { name: 'Helvetica', size: 15, bold: true, color: { argb: 'FFA8892A' } };
      // white background for title and yellow text (system accent)
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      // set height for the title row
      sheetExcel.getRow(4).height = 20;
    }

    // Insert user metadata (who generated the import) at column C rows 5 and 6 if available
    try {
      const userId = req.user?.id;
      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { name: true, cpfCnpj: true } });
        if (user) {
          const nameCell = sheetExcel.getRow(5).getCell(titleColStart);
          nameCell.value = user.name || '';
          nameCell.alignment = { horizontal: 'left', vertical: 'middle' };

          const cpfCell = sheetExcel.getRow(6).getCell(titleColStart);
          cpfCell.value = user.cpfCnpj || '';
          cpfCell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      }
    } catch (e) {
      // non-fatal: if fetching user fails, continue without metadata
      console.error('Não foi possível buscar dados do usuário para inserir no arquivo:', e && e.message ? e.message : e);
    }

    // leave space below the logo/title and write header later — shift headers/data down by 3 more rows
    const headerRowIndexExcel = 7;
    sheetExcel.getRow(headerRowIndexExcel).values = outHeaders;
    // style header row
    const headerRow = sheetExcel.getRow(headerRowIndexExcel);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 18;
    // give header a light gray background and add borders
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    const thinBorder = { style: 'thin', color: { argb: 'FFBDBDBD' } };
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = headerFill;
      cell.border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: thinBorder,
      };
    });

    // hide Excel gridlines for a cleaner look
    sheetExcel.views = [{ showGridLines: false }];

    // write data rows starting at headerRowIndexExcel + 1
    let excelRowIdx = headerRowIndexExcel + 1;
    for (let i = 1; i < outRows.length; i++) {
      const values = outRows[i];
      const row = sheetExcel.getRow(excelRowIdx);
      // ExcelJS rows are 1-based and values should start at index 1
      row.values = [ , ...values];

      // If there's a Base Legal column and the cell contains a link, make it clickable
      try {
        if (baseLegalColIndex >= 0) {
          const cellValue = values[baseLegalColIndex];
          if (cellValue && typeof cellValue === 'string' && /^https?:\/\//i.test(cellValue.trim())) {
            const cell = row.getCell(baseLegalColIndex + 1); // ExcelJS 1-based
            cell.value = { text: 'Base Legal - LC 214/25', hyperlink: cellValue.trim() };
            // style as link
            cell.font = { color: { argb: 'FF0000FF' }, underline: true };
          }
        }
      } catch (e) {
        // non-fatal: continue
        console.error('Erro ao inserir hyperlink na célula Base Legal:', e && e.message ? e.message : e);
      }
      excelRowIdx++;
    }

    // auto-width for columns (simple heuristic)
    for (let c = 1; c <= totalCols; c++) {
      const column = sheetExcel.getColumn(c);
      column.width = Math.min(60, Math.max(12, (column.values || []).reduce((max, v) => Math.max(max, v ? String(v).length : 0), 0) + 4));
    }

    const outBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', `attachment; filename="${(filename||'result').replace(/\.[^.]+$/, '')}_completado.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(Buffer.from(outBuffer));
  } catch (err) {
    console.error('Erro no import-ncm:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Erro interno ao processar importação.' });
  }
});

// GET /util/download-modelo
// Returns a small XLSX workbook to be used as import template
utilRouter.get('/download-modelo', async (req, res) => {
  try {
    const modeloPath = path.resolve(__dirname, '..', 'utils', 'Modelo Importacao.xlsx');
    if (!fs.existsSync(modeloPath)) {
      console.error('Arquivo de modelo não encontrado em', modeloPath);
      return res.status(404).json({ error: 'Arquivo de modelo não encontrado no servidor' });
    }

    // Use res.download to correctly set headers and handle streaming
    return res.download(modeloPath, 'Modelo Importacao.xlsx', (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo modelo:', err && err.stack ? err.stack : err);
        if (!res.headersSent) res.status(500).json({ error: 'Erro ao enviar o arquivo de modelo' });
      }
    });
  } catch (err) {
    console.error('Erro ao enviar modelo de importação:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Erro ao enviar modelo' });
  }
});
