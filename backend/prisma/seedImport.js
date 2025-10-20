import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function seed() {
  try {
    const filePath = path.join(__dirname, "../data/NCM_expandido.xlsx");
    const workbook = XLSX.readFile(filePath);

    const ncmSheet = XLSX.utils.sheet_to_json(workbook.Sheets["NCM"]);
    const classSheet = XLSX.utils.sheet_to_json(workbook.Sheets["ClassTrib"]);

    console.log(`📘 Lendo ${ncmSheet.length} NCMs e ${classSheet.length} classificações...`);

    // 1️⃣ Inserir ClassTrib primeiro (aguardando o término)
    for (const c of classSheet) {
      await prisma.classTrib.upsert({
        where: { codigoClassTrib: Number(c.cClassTrib) },
        update: {},
        create: {
          codigoClassTrib: Number(c.cClassTrib),
          cstIbsCbs: c["CST-IBS/CBS"]?.toString(),
          descricaoCstIbsCbs: c["Descrição CST-IBS/CBS"] || "",
          descricaoClassTrib: c["Descrição cClassTrib"] || "",
          lcRedacao: c["LC Redação"] || "",
          lc214_25: c["LC 214/25"] || "",
          pRedIBS: Number(c.pRedIBS) || 0,
          pRedCBS: Number(c.pRedCBS) || 0,
          link: c.Link || "",
        },
      });
    }

    console.log("✅ ClassTrib importado com sucesso. Inserindo NCMs...");

    // 2️⃣ Inserir NCM (somente depois)
    for (const n of ncmSheet) {
      await prisma.ncm.upsert({
        where: {
          codigo_cClasstrib: {
            codigo: n.ncm.toString(),
            cClasstrib: Number(n.cclasstrib),
          },
        },
        update: {},
        create: {
          codigo: n.ncm.toString(),
          descricao: n.descrição || "",
          cClasstrib: Number(n.cclasstrib),
        },
      });
    }

    console.log("✅ NCM importado com sucesso!");
  } catch (err) {
    console.error("❌ Erro na importação:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
