-- CreateEnum
CREATE TYPE "QuotaType" AS ENUM ('DAILY', 'PACKAGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "packageLimit" INTEGER DEFAULT 0,
ADD COLUMN     "packageRemaining" INTEGER DEFAULT 0,
ADD COLUMN     "quotaType" "QuotaType" NOT NULL DEFAULT 'DAILY';
