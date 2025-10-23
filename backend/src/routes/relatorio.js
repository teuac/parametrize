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

  // === Cabeçalho escuro com logo e título em amarelo ===
  doc.save();
  // barra preta no topo
  doc.rect(0, 0, doc.page.width, 90).fill('#0b0b0b');
  // logo pequeno no canto (pintada com a cor da empresa quando possível)
  if (fs.existsSync(logoPath)) {
    try {
      doc.fillColor('#A8892A');
      doc.image(logoPath, 40, 15, { width: 60, mask: true });
    } catch (err) {
      // fallback to plain image
      try { doc.image(logoPath, 40, 15, { width: 60 }); } catch (e) {}
    }
  }
  // nome da empresa em amarelo
  doc.fillColor('#A8892A').font('Helvetica-Bold').fontSize(20).text('PARAMETRIZE', 110, 30);
  // título do relatório (subtítulo) em branco/clareado sob o título
  doc.fillColor('#ffffff').font('Helvetica').fontSize(12).text('Relatório de NCMs', 110, 55);
  doc.restore();

  doc.moveDown(1.5);

  // === Tabela ===
  const startX = 40;
  let y = doc.y + 10;
  const colWidths = [70, 220, 50, 70, 70];
  const headers = ["Código", "Descrição", "CST", "Aliq IBS", "Aliq CBS"];

  const drawCell = (text, x, y, width, height, align = "left") => {
    doc.rect(x, y, width, height).strokeColor("#999").lineWidth(0.3).stroke();
    doc.text(text, x + 4, y + 5, { width: width - 8, align });
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
  const c = ncm.classTrib;
  if (!c) continue; // sem relação, pula

  const pRedIBS = parseFloat(c.pRedIBS) || 0;
  const pRedCBS = parseFloat(c.pRedCBS) || 0;
  const aliqIBS = (0.10 * (1 - pRedIBS / 100)).toFixed(4);
  const aliqCBS = (0.90 * (1 - pRedCBS / 100)).toFixed(4);

  x = startX;
  drawCell(ncm.codigo, x, y, colWidths[0], 20);
  drawCell(ncm.descricao.slice(0, 40), (x += colWidths[0]), y, colWidths[1], 20);
  drawCell(c.cstIbsCbs || "-", (x += colWidths[1]), y, colWidths[2], 20, "center");
  drawCell(aliqIBS, (x += colWidths[2]), y, colWidths[3], 20, "center");
  drawCell(aliqCBS, (x += colWidths[3]), y, colWidths[4], 20, "center");

  y += 20;

  // quebra de página automática
  if (y > doc.page.height - 80) {
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
          const aliqIBS = 0.10 * (1 - pRedIBS / 100);
          const aliqCBS = 0.90 * (1 - pRedCBS / 100);

          sheet.addRow({
            codigo: ncm.codigo,
            descricao: ncm.descricao,
            cst: c.cstIbsCbs,
            pRedIBS: `${pRedIBS}%`,
            pRedCBS: `${pRedCBS}%`,
            aliqIBS: `${aliqIBS.toFixed(4)}%`,
            aliqCBS: `${aliqCBS.toFixed(4)}%`,
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
      txt += "Código | Descrição | CST | Aliq IBS | Aliq CBS\n";
      txt += "------------------------------------------------------------\n";

      ncmList.forEach((ncm) => {
        if (!Array.isArray(ncm.classTrib) || !ncm.classTrib.length) return;

        ncm.classTrib.forEach((c) => {
          const pRedIBS = parseFloat(c.pRedIBS) || 0;
          const pRedCBS = parseFloat(c.pRedCBS) || 0;
          const aliqIBS = 0.10 * (1 - pRedIBS / 100);
          const aliqCBS = 0.90 * (1 - pRedCBS / 100);

          txt += `${ncm.codigo} | ${ncm.descricao.slice(0, 40)} | ${c.cstIbsCbs || "-"} | ${aliqIBS.toFixed(4)} | ${aliqCBS.toFixed(4)}\n`;
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
