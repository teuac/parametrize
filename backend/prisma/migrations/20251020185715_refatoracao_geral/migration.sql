/*
  Warnings:

  - A unique constraint covering the columns `[codigo,cClasstrib]` on the table `Ncm` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Ncm_codigo_cClasstrib_key" ON "Ncm"("codigo", "cClasstrib");
