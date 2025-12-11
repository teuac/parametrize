-- AlterEnum
ALTER TYPE "QuotaType" ADD VALUE 'MONTHLY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastMonthlyRenewal" TIMESTAMP(3),
ADD COLUMN     "monthlyLimit" INTEGER DEFAULT 0,
ADD COLUMN     "monthlyRemaining" INTEGER DEFAULT 0,
ADD COLUMN     "monthlyRenewalDay" INTEGER DEFAULT 1;
