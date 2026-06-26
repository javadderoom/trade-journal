-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_agent" TEXT;
