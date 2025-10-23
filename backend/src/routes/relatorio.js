import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { prisma } from "../prismaClient.js";

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
    // rotaciona ao centro
    doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
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
  doc.fillColor('#A8892A').font('Helvetica-Bold').fontSize(20).text('Classificação Tributária', 0, 30, { align: 'center' });
  doc.restore();

  doc.moveDown(1.5);

  // === Tabela ===
  const startX = 40;
  let y = doc.y + 10;
  // compute available width between left startX and right margin (40)
  const availableWidth = doc.page.width - startX - 40; // page width minus left and right margins
  // keep some sensible minimums for small pages
  const minCodigo = 70;
  const minClas = 80; // new column for cClasTrib
  const minCst = 50;
  const minAliq = 70;
  // description gets the remaining space
  const colWidths = [
    minCodigo,
    Math.max(150, availableWidth - (minCodigo + minClas + minCst + minAliq + minAliq)),
    minClas,
    minCst,
    minAliq,
    minAliq,
  ];
  const headers = ["Código", "Descrição", "cClasTrib", "CST", "Aliq IBS", "Aliq CBS"];

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
  drawCell(String(formattedClas || ""), (x += colWidths[1]), y, colWidths[2], rowHeight);
      drawCell(c.cstIbsCbs || "-", (x += colWidths[2]), y, colWidths[3], rowHeight, "center");
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
      const sheet = workbook.addWorksheet("Relatório NCM");

      sheet.columns = [
        { header: "Código", key: "codigo", width: 15 },
        { header: "Descrição", key: "descricao", width: 40 },
        { header: "cClasTrib", key: "cClasTrib", width: 15 },
        { header: "CST", key: "cst", width: 10 },
        { header: "Redução IBS", key: "pRedIBS", width: 15 },
        { header: "Redução CBS", key: "pRedCBS", width: 15 },
        { header: "Aliquota IBS", key: "aliqIBS", width: 15 },
        { header: "Aliquota CBS", key: "aliqCBS", width: 15 },
      ];

      ncmList.forEach((ncm) => {
        if (!Array.isArray(ncm.classTrib) || !ncm.classTrib.length) return;

        ncm.classTrib.forEach((c) => {
          const pRedIBS = parseFloat(c.pRedIBS) || 0;
          const pRedCBS = parseFloat(c.pRedCBS) || 0;
          const aliqIBSVal = 0.10 * (1 - pRedIBS / 100);
          const aliqCBSVal = 0.90 * (1 - pRedCBS / 100);
          const zeroCsts = new Set(["400", "410", "510", "550", "620"]);
          const cstCode = String(c.cstIbsCbs || "").trim();
          const aliqIBSStr = zeroCsts.has(cstCode) ? "0%" : aliqIBSVal.toFixed(2) + "%";
          const aliqCBSStr = zeroCsts.has(cstCode) ? "0%" : aliqCBSVal.toFixed(2) + "%";

          sheet.addRow({
            codigo: ncm.codigo,
            descricao: ncm.descricao,
            cClasTrib: padClas(c.codigoClassTrib),
            cst: c.cstIbsCbs,
            pRedIBS: `${pRedIBS}%`,
            pRedCBS: `${pRedCBS}%`,
            aliqIBS: aliqIBSStr,
            aliqCBS: aliqCBSStr,
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader("Content-Disposition", 'attachment; filename="relatorio_ncm.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    }

    // ===================================================================
    // 📄 === GERAÇÃO DO TXT ===
    // ===================================================================
    if (formatoLimpo === "txt") {
  let txt = "RELATÓRIO DE NCMs FIXADOS - PARAMETRIZZE\n\n";
  txt += "Código | Descrição | cClasTrib | CST | Aliq IBS | Aliq CBS\n";
  txt += "-------------------------------------------------------------------\n";

      ncmList.forEach((ncm) => {
        if (!Array.isArray(ncm.classTrib) || !ncm.classTrib.length) return;

        ncm.classTrib.forEach((c) => {
          const pRedIBS = parseFloat(c.pRedIBS) || 0;
          const pRedCBS = parseFloat(c.pRedCBS) || 0;
          const aliqIBSVal = 0.10 * (1 - pRedIBS / 100);
          const aliqCBSVal = 0.90 * (1 - pRedCBS / 100);
          const zeroCsts = new Set(["400", "410", "510", "550", "620"]);
          const cstCode = String(c.cstIbsCbs || "").trim();
          const aliqIBSTxt = zeroCsts.has(cstCode) ? "0%" : aliqIBSVal.toFixed(2) + "%";
          const aliqCBSTxt = zeroCsts.has(cstCode) ? "0%" : aliqCBSVal.toFixed(2) + "%";

          txt += `${ncm.codigo} | ${ncm.descricao.slice(0, 40)} | ${padClas(c.codigoClassTrib) || ""} | ${c.cstIbsCbs || "-"} | ${aliqIBSTxt} | ${aliqCBSTxt}\n`;
        });
      });

      res.setHeader("Content-Disposition", 'attachment; filename="relatorio_ncm.txt"');
      res.setHeader("Content-Type", "text/plain");
      return res.send(txt);
    }

    return res.status(400).json({ error: "Formato inválido. Use pdf, xlsx ou txt." });
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).json({ error: "Erro interno ao gerar relatório." });
  }
});

export default router;
