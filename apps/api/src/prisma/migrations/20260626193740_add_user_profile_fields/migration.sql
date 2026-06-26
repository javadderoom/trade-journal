-- CreateEnum
CREATE TYPE "DisplayCurrency" AS ENUM ('USD', 'TOMAN', 'BOTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "display_currency" "DisplayCurrency" NOT NULL DEFAULT 'USD';
