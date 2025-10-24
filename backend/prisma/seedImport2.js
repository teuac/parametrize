// prisma/seedImport2.js
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import pkg from "xlsx";

const { readFile, utils } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando importação da planilha...");

  const filePath = "./TABELA_NCMS_TRATADA.xlsx";
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  // ✅ Ler o arquivo Excel corretamente
  const workbook = readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = utils.sheet_to_json(sheet);

  console.log(`📊 ${rawData.length} linhas encontradas.`);

  console.log("🧹 Limpando tabela Ncm...");
  await prisma.ncm.deleteMany();

  console.log("💾 Inserindo dados...");
  let count = 0;
  for (const row of rawData) {
    // 🔧 Normaliza chaves
    const normalized = {};
    for (const key in row) {
      const newKey = key
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
      normalized[newKey] = row[key];
    }

    const codigo = normalized.codigo;
    const descricao = normalized.descricao;
    const cClasstrib = normalized.cclasstrib;

    if (!codigo || !descricao || !cClasstrib) continue;

    await prisma.ncm.create({
      data: {
        codigo: codigo.toString().trim(),
        descricao: descricao.toString().trim(),
        cClasstrib: cClasstrib.toString().trim(),
      },
    });

    count++;
    if (count % 500 === 0) console.log(`➡️ ${count} registros inseridos...`);
  }

  console.log(`✅ Importação concluída: ${count} registros inseridos.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro na importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
