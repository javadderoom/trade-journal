-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('DEMO', 'LIVE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN "account_type" "AccountType" NOT NULL DEFAULT 'LIVE';
