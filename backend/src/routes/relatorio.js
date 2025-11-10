import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { prisma } from "../prismaClient.js";
import jwt from 'jsonwebtoken';

const router = express.Router();

// ESM: derive __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", async (req, res) => {
  try {
    const { codigos, formato = "pdf" } = req.query;
    const formatoLimpo = formato.trim().toLowerCase();

    if (!codigos) {
      return res.status(400).json({ error: "Nenhum código informado." });
    }

 const listaCodigos = codigos.split(",").map((c) => c.trim());

const ncmList = await prisma.ncm.findMany({
  where: { codigo: { in: listaCodigos } },
  include: { classTrib: true },
  orderBy: { codigo: "asc" },
});

console.log("📊 NCMs encontrados:", ncmList.length);
if (!ncmList.length) {
  return res.status(404).json({ error: "Nenhum NCM encontrado." });
}
    console.log("📊 NCMs encontrados:", ncmList.length);
    if (!ncmList.length) {
      return res.status(404).json({ error: "Nenhum NCM encontrado." });
    }

    // try to resolve the requesting user from JWT (optional)
    const getRequestUser = async (req) => {
      try {
        const auth = req.headers.authorization;
        if (!auth) return null;
        const [, token] = auth.split(' ');
        if (!token) return null;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload?.id) return null;
        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        return user;
      } catch (err) {
        return null;
      }
    };

    const requestUser = await getRequestUser(req);

    // helper: format aliquotas (trim trailing zeros and append %)
    const formatAliq = (val, decimals = 4) => {
      const num = Number(val) || 0;
      const fixed = num.toFixed(decimals);
      const trimmed = fixed.replace(/\.?0+$/, "");
      return `${trimmed}%`;
    };

    // helper: format classTrib code to 6 digits with leading zeros
    const padClas = (v) => {
      if (v === null || v === undefined || v === "") return "";
      const s = String(v);
      return s.padStart(6, "0");
    };

    // ===================================================================
    // 🧾 === GERAÇÃO DO PDF ===
    // ===================================================================
  // parse optional `selected` query param which may contain items like '1234-000001' or '1234-ALL'
  const selectedRaw = (req.query.selected || '').toString();
  const selectedArr = selectedRaw ? selectedRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const selectedAllSet = new Set(selectedArr.filter(s => s.endsWith('-ALL')).map(s => s.replace(/-ALL$/, '')));
  const selectedKeysSet = new Set(selectedArr.filter(s => !s.endsWith('-ALL')));
    if (formato === "pdf") {
  const tmpDir = path.resolve("tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const filePath = path.resolve(tmpDir, `relatorio_ncm_${Date.now()}.pdf`);
  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // === Marca d'água (logo opaca no fundo) ===
  const logoPath = path.resolve(__dirname, '..', 'utils', 'logo.png');
  const addWatermark = () => {
    if (!fs.existsSync(logoPath)) return;
    const wmWidth = Math.min(600, doc.page.width * 0.8);
    const wmX = (doc.page.width - wmWidth) / 2;
    const wmY = (doc.page.height - wmWidth) / 2;
    doc.save();
    // baixa opacidade
    if (typeof doc.opacity === 'function') doc.opacity(0.06);
    try {
      // Use the image as a mask and fill with the company's yellow
      doc.fillColor('#A8892A');
      // PDFKit supports using an image as a mask; passing { mask: true } will
      // draw the current fill clipped to the image shape if the image is a mask.
      doc.image(logoPath, wmX, wmY, { width: wmWidth, mask: true });
    } catch (err) {
      // fallback: draw the image normally if mask isn't supported
      try { doc.image(logoPath, wmX, wmY, { width: wmWidth }); } catch (_) {}
    }
    doc.restore();
  };

  addWatermark();

  // === Cabeçalho: logo maior, sem fundo, título centralizado ===
  doc.save();
  // logo aumentada no canto (pintada com a cor da empresa quando possível)
    if (fs.existsSync(logoPath)) {
    try {
      doc.fillColor('#A8892A');
      // subir a logo reduzindo o Y (mais próximo ao topo)
      // moved from y=0 to y=-10 for a higher position
      doc.image(logoPath, 40, -10, { width: 100, mask: true });
    } catch (err) {
      // fallback to plain image
      try { doc.image(logoPath, 40, -10, { width: 100 }); } catch (e) {}
    }
  }
  // título centralizado (removido o texto 'PARAMETRIZE' e sem fundo preto)
  // descer o título um pouco para evitar sobreposição com a logo
  // agora aplicamos um pequeno deslocamento para a direita (em pixels)
  const titleText = 'Classificação Tributária';
  doc.fillColor('#A8892A').font('Helvetica-Bold').fontSize(20);
  const titleWidth = doc.widthOfString(titleText);
  const shiftRight = 4; // pequeno deslocamento para a direita
  const titleX = doc.page.width / 2 - titleWidth / 2 + shiftRight;
  doc.text(titleText, titleX, 50);
  doc.restore();

  // include requesting user name and cpf/cnpj in header if available
  try {
    const nameLine = requestUser && requestUser.name ? String(requestUser.name).trim() : '';
    const cpfLine = requestUser && requestUser.cpfCnpj ? String(requestUser.cpfCnpj).trim() : '';
    if (nameLine || cpfLine) {
      doc.font('Helvetica').fontSize(10).fillColor('#000');
      const line1 = `${nameLine}`.trim();
      const line2 = cpfLine ? `CPF/CNPJ: ${cpfLine}` : '';
      // place the block in the top-right corner
      const textBlockWidth = 200; // fixed width for the corner block
      const textBlockX = Math.max(40, doc.page.width - 40 - textBlockWidth); // start X so the block sits near right margin
      const startY = 20; // top area
      // right-align the lines inside the block so they sit flush to the right corner
      doc.text(line1, textBlockX, startY, { width: textBlockWidth, align: 'right' });
      if (line2) doc.text(line2, textBlockX, startY + 12, { width: textBlockWidth, align: 'right' });
    }
  } catch (e) {}

  // Increase gap between header and table so the table appears lower on the page
  // small additional push to move table further down than before
  doc.moveDown(2.8);

  // === Tabela ===
  const startX = 40;
  // add a larger vertical offset so the table starts noticeably lower
  let y = doc.y + 48;
  // compute available width between left startX and right margin (40)
  const availableWidth = doc.page.width - startX - 40; // page width minus left and right margins
  // keep some sensible minimums for small pages
  const minCodigo = 70;
  const minClas = 80; // new column for cClassTrib
  const minCst = 50;
  const minAliq = 70;
  // description gets the remaining space
  const colWidths = [
    minCodigo,
    Math.max(150, availableWidth - (minCodigo + minCst + minClas + minAliq + minAliq)),
    minCst,
    minClas,
    minAliq,
    minAliq,
  ];
  const headers = ["Código", "Descrição", "CST", "cClassTrib", "Aliq IBS", "Aliq CBS"];

  const drawCell = (text, x, y, width, height, align = "left") => {
    doc.rect(x, y, width, height).strokeColor("#999").lineWidth(0.3).stroke();
    // ensure text is drawn inside the cell with small padding
    doc.text(text || "", x + 4, y + 5, { width: width - 8, align });
  };

  // Cabeçalho da tabela
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111");
  let x = startX;
      headers.forEach((h, i) => {
        drawCell(h, x, y, colWidths[i], 20, "center");
        x += colWidths[i];
      });

  y += 20;
  doc.font("Helvetica").fontSize(9).fillColor("#000");

  // === Linhas ===
    for (const ncm of ncmList) {
    // normalize classTrib to an array for consistent iteration
    const classTribs = Array.isArray(ncm.classTrib)
      ? ncm.classTrib
      : ncm.classTrib ? [ncm.classTrib] : [];
    if (!classTribs.length) continue;

    for (const c of classTribs) {
      // determine whether to include this classTrib based on selection
      const compositeKey = `${ncm.codigo}-${c.codigoClassTrib}`;
      if (selectedArr.length) {
        // if this NCM code is selected as ALL, keep it; otherwise require exact composite key
        if (!selectedAllSet.has(ncm.codigo) && !selectedKeysSet.has(compositeKey)) continue;
      }
      const pRedIBS = parseFloat(c.pRedIBS) || 0;
      const pRedCBS = parseFloat(c.pRedCBS) || 0;
      const aliqIBSVal = 0.10 * (1 - pRedIBS / 100);
      const aliqCBSVal = 0.90 * (1 - pRedCBS / 100);
      // if CST is one of these codes, aliquotas must be 0%
      const zeroCsts = new Set(["400", "410", "510", "550", "620"]);
      const cstCode = String(c.cstIbsCbs || "").trim();
      let aliqIBS, aliqCBS;
      if (zeroCsts.has(cstCode)) {
        aliqIBS = "0%";
        aliqCBS = "0%";
      } else {
        // append '%' to the numeric aliq values (do not convert the value)
        // show with 2 decimal places as requested
        aliqIBS = aliqIBSVal.toFixed(2) + "%";
        aliqCBS = aliqCBSVal.toFixed(2) + "%";
      }

      // measure heights for each cell's text to allow wrapping and dynamic row height
      const paddingV = 10; // vertical padding inside cell (top+bottom)
      const hCodigo = doc.heightOfString(String(ncm.codigo || ""), { width: colWidths[0] - 8 });
      const hDesc = doc.heightOfString(String(ncm.descricao || ""), { width: colWidths[1] - 8 });
  const formattedClas = padClas(c.codigoClassTrib);
  const hClas = doc.heightOfString(String(formattedClas || ""), { width: colWidths[2] - 8 });
      const hCst = doc.heightOfString(String(c.cstIbsCbs || "-"), { width: colWidths[3] - 8 });
      const hAliq1 = doc.heightOfString(String(aliqIBS), { width: colWidths[4] - 8 });
      const hAliq2 = doc.heightOfString(String(aliqCBS), { width: colWidths[5] - 8 });

      const rowHeight = Math.max(20, hCodigo, hDesc, hClas, hCst, hAliq1, hAliq2) + paddingV;

      // quebra de página automática usando a altura real da linha
      if (y + rowHeight > doc.page.height - 80) {
        doc.addPage();
        addWatermark();
        y = 60;
        x = startX;
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111");
        headers.forEach((h, i) => {
          drawCell(h, x, y, colWidths[i], 20, "center");
          x += colWidths[i];
        });
        y += 20;
        doc.font("Helvetica").fontSize(9);
      }

    x = startX;
    drawCell(ncm.codigo, x, y, colWidths[0], rowHeight);
    drawCell(String(ncm.descricao || ""), (x += colWidths[0]), y, colWidths[1], rowHeight);
    drawCell(c.cstIbsCbs || "-", (x += colWidths[1]), y, colWidths[2], rowHeight, "center");
  drawCell(String(formattedClas || ""), (x += colWidths[2]), y, colWidths[3], rowHeight);
    drawCell(aliqIBS, (x += colWidths[3]), y, colWidths[4], rowHeight, "center");
    drawCell(aliqCBS, (x += colWidths[4]), y, colWidths[5], rowHeight, "center");

      y += rowHeight;
    }
  }

  // === Rodapé ===
  doc
    .moveDown(2)
    .fontSize(8)
    .fillColor("#666")
    .text(`Gerado em: ${new Date().toLocaleString()}`, { align: "right" });

  // Finaliza o PDF
  doc.end();

  stream.on("finish", () => {
    res.download(filePath, "relatorio_ncm.pdf", (err) => {
      if (err) console.error("Erro ao enviar PDF:", err);
      fs.unlink(filePath, () => {});
    });
  });
  return;
}

    // ===================================================================
    // 📊 === GERAÇÃO DO EXCEL ===
    // ===================================================================
    if (formatoLimpo === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const templatePath = path.resolve(__dirname, '..', 'utils', 'modelo relatiorio excel.xlsx');

      // Try to load the template if it exists; otherwise create a fresh workbook
      if (fs.existsSync(templatePath)) {
        await workbook.xlsx.readFile(templatePath);
      } else {
        // fallback: create a simple sheet similar to PDF
        const sheetFallback = workbook.addWorksheet('Relatório NCM');
        sheetFallback.columns = [
          { header: 'Código', key: 'codigo', width: 15 },
          { header: 'Descrição', key: 'descricao', width: 50 },
          { header: 'CST', key: 'cst', width: 12 },
          { header: 'cClassTrib', key: 'cClassTrib', width: 15 },
          { header: 'Aliquota IBS', key: 'aliqIBS', width: 14 },
          { header: 'Aliquota CBS', key: 'aliqCBS', width: 14 },
        ];
      }

      const sheet = workbook.worksheets[0];

      // Robust header-row detection: normalize (remove diacritics) so
      // templates using 'Código' or 'Codigo' are treated the same.
      const normalize = (s) => String(s || '')
        .normalize('NFD')
        .replace(/[ -]/g, (c) => c) // keep ASCII intact
        .normalize('NFD')
        .replace(/[ -]/g, (c) => c)
        .replace(/\u0300|\u0301|\u0302|\u0303|\u0308/g, '')
        .replace(/[\u0000-\u007f]/g, (c) => c)
        .replace(/\p{Diacritic}/gu, '')
        .normalize()
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      let headerRowIndex = null;
      for (let r = 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const vals = row.values || [];
        // check if this row looks like the header by finding both a codigo and descricao-like header
        let hasCodigo = false;
        let hasDescr = false;
        for (const v of vals) {
          if (typeof v !== 'string') continue;
          const vnorm = normalize(v);
          if (vnorm.includes('cod') || vnorm.includes('codigo')) hasCodigo = true;
          if (vnorm.includes('descr') || vnorm.includes('descricao')) hasDescr = true;
        }
        if (hasCodigo && hasDescr) {
          headerRowIndex = r;
          break;
        }
      }
      if (!headerRowIndex) headerRowIndex = 6; // final fallback

      // insert generated-by row(s) above header if we have requestUser info
      try {
        const nameLine = requestUser && requestUser.name ? String(requestUser.name).trim() : '';
        const cpfLine = requestUser && requestUser.cpfCnpj ? String(requestUser.cpfCnpj).trim() : '';
        if (nameLine || cpfLine) {
          const firstRow = `Relatorio gerado por: ${nameLine}`.trim();
          // insert name line and place it on the right by merging across the sheet and aligning right
          const insertAt1 = headerRowIndex;
          sheet.spliceRows(insertAt1, 0, [firstRow]);
          // merge across all columns so the text can sit at the far right
          try {
            sheet.mergeCells(insertAt1, 1, insertAt1, sheet.columnCount);
          } catch (e) {}
          const cell1 = sheet.getRow(insertAt1).getCell(1);
          cell1.value = firstRow;
          cell1.alignment = { horizontal: 'right' };
          headerRowIndex += 1; // shift header down
          // insert cpf/cnpj on the next line if present and align right across the sheet
          if (cpfLine) {
            const insertAt2 = headerRowIndex;
            sheet.spliceRows(insertAt2, 0, [`CPF/CNPJ: ${cpfLine}`]);
            try {
              sheet.mergeCells(insertAt2, 1, insertAt2, sheet.columnCount);
            } catch (e) {}
            const cell2 = sheet.getRow(insertAt2).getCell(1);
            cell2.value = `CPF/CNPJ: ${cpfLine}`;
            cell2.alignment = { horizontal: 'right' };
            headerRowIndex += 1;
          }
        }
      } catch (e) {}

      // remove existing data rows after header
      for (let i = sheet.rowCount; i > headerRowIndex; i--) {
        sheet.spliceRows(i, 1);
      }

      const headerRow = sheet.getRow(headerRowIndex);
      // build header->colIndex map
      // Build a header -> index map using a normalized key (no accents),
      // making matching tolerant to accents and casing.
      const headerLowerMap = {};
      const normalizeForKey = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      for (let c = 1; c <= sheet.columnCount; c++) {
        const h = headerRow.getCell(c).value;
        if (!h) continue;
        const key = normalizeForKey(h);
        headerLowerMap[key] = c; // store column index (1-based)
      }

      // Helper to find a column by requiring that all fragments are present
      // in the lower-cased header name. This makes matching robust to
      // small template differences like 'cClasstrib' vs 'cClassTrib'.
      const findColByFragments = (fragments = []) => {
        const fLower = fragments.map((s) => normalizeForKey(s));
        for (const key of Object.keys(headerLowerMap)) {
          let ok = true;
          for (const frag of fLower) {
            if (!key.includes(frag)) {
              ok = false;
              break;
            }
          }
          if (ok) return headerLowerMap[key];
        }
        return null;
      };

  // start inserting data right below header
  let insertAt = headerRowIndex + 1;
      for (const ncm of ncmList) {
        const classTribs = Array.isArray(ncm.classTrib)
          ? ncm.classTrib
          : ncm.classTrib ? [ncm.classTrib] : [];
        if (!classTribs.length) continue;

        for (const c of classTribs) {
          const compositeKey = `${ncm.codigo}-${c.codigoClassTrib}`;
          if (selectedArr.length) {
            if (!selectedAllSet.has(ncm.codigo) && !selectedKeysSet.has(compositeKey)) continue;
          }
          const pRedIBS = parseFloat(c.pRedIBS) || 0;
          const pRedCBS = parseFloat(c.pRedCBS) || 0;
          const aliqIBSVal = 0.10 * (1 - pRedIBS / 100);
          const aliqCBSVal = 0.90 * (1 - pRedCBS / 100);
          const zeroCsts = new Set(['400','410','510','550','620']);
          const cstCode = String(c.cstIbsCbs || '').trim();
          const aliqIBSStr = zeroCsts.has(cstCode) ? '0%' : aliqIBSVal.toFixed(2) + '%';
          const aliqCBSStr = zeroCsts.has(cstCode) ? '0%' : aliqCBSVal.toFixed(2) + '%';

          // build a 1-based array where index matches column number
          const rowVals = [];

          // Attempt to detect the main columns in a flexible way so templates
          // with small header variations still work.
          const colCodigo = findColByFragments(['cod']);
          const colDesc = findColByFragments(['descr']);
          const colCst = findColByFragments(['cst']);
          // class column: match headers that contain both 'clas' and 'trib'
          const colClas = findColByFragments(['clas', 'trib']);
          const colAliqIbs = findColByFragments(['aliq', 'ibs']) || findColByFragments(['aliq', 'ib']);
          const colAliqCbs = findColByFragments(['aliq', 'cbs']) || findColByFragments(['aliq', 'cb']);

          if (colCodigo) rowVals[colCodigo] = ncm.codigo;
          if (colDesc) rowVals[colDesc] = ncm.descricao;
          if (colCst) rowVals[colCst] = c.cstIbsCbs || '-';
          if (colClas) rowVals[colClas] = padClas(c.codigoClassTrib);
          if (colAliqIbs) rowVals[colAliqIbs] = aliqIBSStr;
          if (colAliqCbs) rowVals[colAliqCbs] = aliqCBSStr;

          // insert row at position
          sheet.spliceRows(insertAt, 0, rowVals);
          insertAt++;
        }
      }

      // Apply borders only to the header row(s) and remove borders from other cells
      try {
        const headerIdx = headerRowIndex;
        sheet.eachRow({ includeEmpty: true }, (row) => {
          row.eachCell({ includeEmpty: true }, (cell) => {
            if (row.number === headerIdx) {
              // apply a thin border around header cells
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
              // make header font bold if possible
              try { cell.font = Object.assign({}, cell.font || {}, { bold: true }); } catch (e) {}
            } else {
              // remove borders from non-header cells
              cell.border = undefined;
            }
          });
        });
      } catch (e) { /* ignore if styling not supported */ }
      // Also hide gridlines so the spreadsheet appears without lines when opened in Excel
      try {
        // ExcelJS: set worksheet view to hide gridlines
        sheet.views = [{ showGridLines: false }];
      } catch (e) { /* ignore if view property unsupported */ }

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio_ncm.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    // ===================================================================
    // 📄 === GERAÇÃO DO TXT ===
    // ===================================================================
    if (formatoLimpo === "txt") {
      // Build TXT header
      let txt = "RELATÓRIO DE NCMs FIXADOS - PARAMETRIZE\n\n";
  // include generated-by info in TXT header when available
  try {
    const nameLine = requestUser && requestUser.name ? String(requestUser.name).trim() : '';
    const cpfLine = requestUser && requestUser.cpfCnpj ? String(requestUser.cpfCnpj).trim() : '';
    if (nameLine || cpfLine) {
      const rightWidth = 120; // target width for right alignment in TXT
      const l1 = `Relatorio gerado por: ${nameLine}`.trim();
      txt += l1.length < rightWidth ? l1.padStart(rightWidth) + '\n' : l1 + '\n';
      if (cpfLine) {
        const l2 = `CPF/CNPJ: ${cpfLine}`;
        txt += l2.length < rightWidth ? l2.padStart(rightWidth) + '\n' : l2 + '\n';
      }
      txt += '\n';
    }
  } catch (e) {}

  txt += "Código | Descrição | CST | cClassTrib | Aliq IBS | Aliq CBS\n";
      txt += "-------------------------------------------------------------------\n";

      // Iterate and normalize classTrib like PDF/XLSX
      for (const ncm of ncmList) {
        const classTribs = Array.isArray(ncm.classTrib)
          ? ncm.classTrib
          : ncm.classTrib ? [ncm.classTrib] : [];
        if (!classTribs.length) continue;

        for (const c of classTribs) {
          const compositeKey = `${ncm.codigo}-${c.codigoClassTrib}`;
          if (selectedArr.length) {
            if (!selectedAllSet.has(ncm.codigo) && !selectedKeysSet.has(compositeKey)) continue;
          }
          const pRedIBS = parseFloat(c.pRedIBS) || 0;
          const pRedCBS = parseFloat(c.pRedCBS) || 0;
          const aliqIBSVal = 0.10 * (1 - pRedIBS / 100);
          const aliqCBSVal = 0.90 * (1 - pRedCBS / 100);
          const zeroCsts = new Set(["400", "410", "510", "550", "620"]);
          const cstCode = String(c.cstIbsCbs || "").trim();
          const aliqIBSTxt = zeroCsts.has(cstCode) ? "0%" : aliqIBSVal.toFixed(2) + "%";
          const aliqCBSTxt = zeroCsts.has(cstCode) ? "0%" : aliqCBSVal.toFixed(2) + "%";

          // do not truncate description in TXT; include full description
          const desc = String(ncm.descricao || "").replace(/\r?\n/g, ' ');

          txt += `${ncm.codigo} | ${desc} | ${c.cstIbsCbs || "-"} | ${padClas(c.codigoClassTrib) || ""} | ${aliqIBSTxt} | ${aliqCBSTxt}\n`;
        }
      }

      // footer with generation date
      txt += "\n";
      txt += `Gerado em: ${new Date().toLocaleString()}\n`;

      res.setHeader("Content-Disposition", 'attachment; filename="relatorio_ncm.txt"');
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(txt);
    }

    return res.status(400).json({ error: "Formato inválido. Use pdf, xlsx ou txt." });
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).json({ error: "Erro interno ao gerar relatório." });
  }
});

export default router;