-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "emotion" SET DATA TYPE TEXT;

-- DropEnum
DROP TYPE IF EXISTS "Emotion";
