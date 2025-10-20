/*
  Warnings:

  - Added the required column `cClassTrib` to the `Ncm` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ncm" ADD COLUMN     "cClassTrib" TEXT NOT NULL;
