-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[];
