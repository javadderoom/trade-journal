/*
  Warnings:

  - You are about to drop the column `setup_id` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the `Setup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Setup" DROP CONSTRAINT "Setup_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_setup_id_fkey";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "setup_id";

-- DropTable
DROP TABLE "Setup";
