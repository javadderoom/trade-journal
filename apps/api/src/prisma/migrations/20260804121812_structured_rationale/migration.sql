/*
  Warnings:

  - You are about to drop the column `analysis_timeframe` on the `TradeAnnotation` table. All the data in the column will be lost.
  - You are about to drop the column `entry_timeframe` on the `TradeAnnotation` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `TradeAnnotation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TradingSession" AS ENUM ('ASIA', 'LONDON', 'NEW_YORK', 'OVERLAP');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConceptRole" AS ENUM ('SETUP', 'TRIGGER', 'CONFLUENCE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "current_balance" DOUBLE PRECISION,
ADD COLUMN     "initial_balance" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "ticket" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TradeAnnotation" DROP COLUMN "analysis_timeframe",
DROP COLUMN "entry_timeframe",
DROP COLUMN "tags",
ADD COLUMN     "conviction" INTEGER,
ADD COLUMN     "expectation" TEXT,
ADD COLUMN     "htf_bias" "Direction",
ADD COLUMN     "lesson" TEXT,
ADD COLUMN     "session" "TradingSession",
ADD COLUMN     "thesis" TEXT;

-- CreateTable
CREATE TABLE "EALog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EALog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "cover_image" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "social_copy" TEXT,
    "featured_image_prompt" TEXT,
    "reading_time" INTEGER,
    "seo_score" INTEGER,
    "quality_score" INTEGER,
    "author_id" TEXT NOT NULL,
    "category_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "social_posted" BOOLEAN NOT NULL DEFAULT false,
    "translation_id" TEXT,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingConcept" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowed_roles" "ConceptRole"[],
    "color" TEXT,
    "icon" TEXT,

    CONSTRAINT "TradingConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeSetup" (
    "trade_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TradeTrigger" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TradeTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeConfluence" (
    "trade_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,

    CONSTRAINT "TradeConfluence_pkey" PRIMARY KEY ("trade_id","concept_id")
);

-- CreateTable
CREATE TABLE "TradePlan" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "max_risk" DOUBLE PRECISION,
    "expected_rr" DOUBLE PRECISION,
    "entry_condition" TEXT,
    "invalidation" TEXT,
    "target_zone" TEXT,
    "expected_hold_time" TEXT,
    "plan_followed" BOOLEAN,

    CONSTRAINT "TradePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlogPostToBlogTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogPostToBlogTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "EALog_user_id_idx" ON "EALog"("user_id");

-- CreateIndex
CREATE INDEX "EALog_account_id_idx" ON "EALog"("account_id");

-- CreateIndex
CREATE INDEX "EALog_created_at_idx" ON "EALog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");

-- CreateIndex
CREATE INDEX "BlogTag_slug_idx" ON "BlogTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_translation_id_key" ON "BlogPost"("translation_id");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_published_at_idx" ON "BlogPost"("status", "published_at");

-- CreateIndex
CREATE INDEX "BlogPost_category_id_idx" ON "BlogPost"("category_id");

-- CreateIndex
CREATE INDEX "BlogComment_post_id_is_approved_idx" ON "BlogComment"("post_id", "is_approved");

-- CreateIndex
CREATE INDEX "BlogComment_user_id_idx" ON "BlogComment"("user_id");

-- CreateIndex
CREATE INDEX "BlogComment_parent_id_idx" ON "BlogComment"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "TradingConcept_user_id_name_key" ON "TradingConcept"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TradeSetup_trade_id_key" ON "TradeSetup"("trade_id");

-- CreateIndex
CREATE UNIQUE INDEX "TradeTrigger_trade_id_concept_id_key" ON "TradeTrigger"("trade_id", "concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "TradePlan_trade_id_key" ON "TradePlan"("trade_id");

-- CreateIndex
CREATE INDEX "_BlogPostToBlogTag_B_index" ON "_BlogPostToBlogTag"("B");

-- AddForeignKey
ALTER TABLE "EALog" ADD CONSTRAINT "EALog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EALog" ADD CONSTRAINT "EALog_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCategory" ADD CONSTRAINT "BlogCategory_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "BlogComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingConcept" ADD CONSTRAINT "TradingConcept_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeSetup" ADD CONSTRAINT "TradeSetup_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeSetup" ADD CONSTRAINT "TradeSetup_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "TradingConcept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeTrigger" ADD CONSTRAINT "TradeTrigger_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeTrigger" ADD CONSTRAINT "TradeTrigger_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "TradingConcept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeConfluence" ADD CONSTRAINT "TradeConfluence_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeConfluence" ADD CONSTRAINT "TradeConfluence_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "TradingConcept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradePlan" ADD CONSTRAINT "TradePlan_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_B_fkey" FOREIGN KEY ("B") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "TradeAnnotation_trade_id_unique" RENAME TO "TradeAnnotation_trade_id_key";
