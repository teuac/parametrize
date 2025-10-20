/*
  Warnings:

  - You are about to drop the column `aliquota` on the `ClassTrib` table. All the data in the column will be lost.
  - You are about to drop the column `cst` on the `ClassTrib` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `ClassTrib` table. All the data in the column will be lost.
  - You are about to drop the column `ncmId` on the `ClassTrib` table. All the data in the column will be lost.
  - You are about to drop the column `cClassTrib` on the `Ncm` table. All the data in the column will be lost.
  - You are about to drop the `Util` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codigoClassTrib]` on the table `ClassTrib` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigoClassTrib` to the `ClassTrib` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cClasstrib` to the `Ncm` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ClassTrib" DROP CONSTRAINT "ClassTrib_ncmId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Util" DROP CONSTRAINT "Util_ncmId_fkey";

-- AlterTable
ALTER TABLE "ClassTrib" DROP COLUMN "aliquota",
DROP COLUMN "cst",
DROP COLUMN "descricao",
DROP COLUMN "ncmId",
ADD COLUMN     "codigoClassTrib" INTEGER NOT NULL,
ADD COLUMN     "cstIbsCbs" TEXT,
ADD COLUMN     "descricaoClassTrib" TEXT,
ADD COLUMN     "descricaoCstIbsCbs" TEXT,
ADD COLUMN     "lc214_25" TEXT,
ADD COLUMN     "lcRedacao" TEXT,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "pRedCBS" DECIMAL(5,2),
ADD COLUMN     "pRedIBS" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Ncm" DROP COLUMN "cClassTrib",
ADD COLUMN     "cClasstrib" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."Util";

-- CreateIndex
CREATE UNIQUE INDEX "ClassTrib_codigoClassTrib_key" ON "ClassTrib"("codigoClassTrib");

-- AddForeignKey
ALTER TABLE "Ncm" ADD CONSTRAINT "Ncm_cClasstrib_fkey" FOREIGN KEY ("cClasstrib") REFERENCES "ClassTrib"("codigoClassTrib") ON DELETE SET NULL ON UPDATE CASCADE;
