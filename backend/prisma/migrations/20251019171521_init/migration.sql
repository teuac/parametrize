-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ncm" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Ncm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTrib" (
    "id" SERIAL NOT NULL,
    "ncmId" INTEGER NOT NULL,
    "cst" VARCHAR(10) NOT NULL,
    "aliquota" DECIMAL(5,2) NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ClassTrib_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Util" (
    "id" SERIAL NOT NULL,
    "ncmId" INTEGER NOT NULL,
    "aplicacao" TEXT NOT NULL,

    CONSTRAINT "Util_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ncm_codigo_key" ON "Ncm"("codigo");

-- AddForeignKey
ALTER TABLE "ClassTrib" ADD CONSTRAINT "ClassTrib_ncmId_fkey" FOREIGN KEY ("ncmId") REFERENCES "Ncm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Util" ADD CONSTRAINT "Util_ncmId_fkey" FOREIGN KEY ("ncmId") REFERENCES "Ncm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
