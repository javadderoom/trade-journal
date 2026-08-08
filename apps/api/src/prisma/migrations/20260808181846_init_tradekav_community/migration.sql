/*
  Warnings:

  - You are about to drop the column `replies` on the `CommunityPost` table. All the data in the column will be lost.
  - You are about to drop the column `symbols` on the `CommunityPost` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `CommunityComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ForumReply` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommunityPostType" AS ENUM ('GENERAL', 'QUESTION', 'MARKET_ANALYSIS', 'TRADE_REVIEW', 'EDUCATION', 'DISCUSSION');

-- CreateEnum
CREATE TYPE "CommunityContentStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "CommunityVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS_ONLY');

-- CreateEnum
CREATE TYPE "CommunityReportTargetType" AS ENUM ('POST', 'COMMENT', 'THREAD', 'REPLY');

-- CreateEnum
CREATE TYPE "CommunityReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'MISINFORMATION', 'SCAM', 'INAPPROPRIATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN');

-- DropIndex
DROP INDEX "CommunityPost_authorId_idx";

-- DropIndex
DROP INDEX "ForumThread_categoryId_idx";

-- DropIndex
DROP INDEX "ForumThread_createdAt_idx";

-- AlterTable
ALTER TABLE "CommunityComment" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "status" "CommunityContentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CommunityPost" DROP COLUMN "replies",
DROP COLUMN "symbols",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "comments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "CommunityContentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "threadId" TEXT,
ADD COLUMN     "tradeId" TEXT,
ADD COLUMN     "type" "CommunityPostType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" "CommunityVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "ForumCategory" ALTER COLUMN "icon" DROP NOT NULL,
ALTER COLUMN "icon" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ForumReply" ADD COLUMN     "status" "CommunityContentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ForumThread" ADD COLUMN     "status" "CommunityContentStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "CommunityBookmark" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityBookmark_pkey" PRIMARY KEY ("userId","postId")
);

-- CreateTable
CREATE TABLE "CommunityPostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunitySymbol" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "CommunitySymbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPostSymbol" (
    "postId" TEXT NOT NULL,
    "symbolId" TEXT NOT NULL,

    CONSTRAINT "CommunityPostSymbol_pkey" PRIMARY KEY ("postId","symbolId")
);

-- CreateTable
CREATE TABLE "CommunityCategory" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityFollow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityFollow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "CommunityCategoryFollow" (
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityCategoryFollow_pkey" PRIMARY KEY ("userId","categoryId")
);

-- CreateTable
CREATE TABLE "CommunitySymbolFollow" (
    "userId" TEXT NOT NULL,
    "symbolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunitySymbolFollow_pkey" PRIMARY KEY ("userId","symbolId")
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reason" "CommunityReportReason" NOT NULL,
    "status" "CommunityReportStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "reporterId" TEXT NOT NULL,
    "targetType" "CommunityReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityBookmark_postId_idx" ON "CommunityBookmark"("postId");

-- CreateIndex
CREATE INDEX "CommunityPostMedia_postId_sortOrder_idx" ON "CommunityPostMedia"("postId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CommunitySymbol_symbol_key" ON "CommunitySymbol"("symbol");

-- CreateIndex
CREATE INDEX "CommunityPostSymbol_symbolId_postId_idx" ON "CommunityPostSymbol"("symbolId", "postId");

-- CreateIndex
CREATE INDEX "CommunityCategory_order_idx" ON "CommunityCategory"("order");

-- CreateIndex
CREATE INDEX "CommunityFollow_followingId_idx" ON "CommunityFollow"("followingId");

-- CreateIndex
CREATE INDEX "CommunityCategoryFollow_categoryId_idx" ON "CommunityCategoryFollow"("categoryId");

-- CreateIndex
CREATE INDEX "CommunitySymbolFollow_symbolId_idx" ON "CommunitySymbolFollow"("symbolId");

-- CreateIndex
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityReport_status_createdAt_idx" ON "CommunityReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReport_reporterId_idx" ON "CommunityReport"("reporterId");

-- CreateIndex
CREATE INDEX "CommunityComment_postId_createdAt_idx" ON "CommunityComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityComment_authorId_idx" ON "CommunityComment"("authorId");

-- CreateIndex
CREATE INDEX "CommunityComment_parentId_idx" ON "CommunityComment"("parentId");

-- CreateIndex
CREATE INDEX "CommunityLike_userId_idx" ON "CommunityLike"("userId");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_categoryId_createdAt_idx" ON "CommunityPost"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_threadId_idx" ON "CommunityPost"("threadId");

-- CreateIndex
CREATE INDEX "CommunityPost_tradeId_idx" ON "CommunityPost"("tradeId");

-- CreateIndex
CREATE INDEX "CommunityPost_status_createdAt_idx" ON "CommunityPost"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ForumCategory_order_idx" ON "ForumCategory"("order");

-- CreateIndex
CREATE INDEX "ForumReply_threadId_createdAt_idx" ON "ForumReply"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_authorId_idx" ON "ForumReply"("authorId");

-- CreateIndex
CREATE INDEX "ForumThread_categoryId_createdAt_idx" ON "ForumThread"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumThread_authorId_idx" ON "ForumThread"("authorId");

-- CreateIndex
CREATE INDEX "ForumThread_status_createdAt_idx" ON "ForumThread"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommunityCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBookmark" ADD CONSTRAINT "CommunityBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBookmark" ADD CONSTRAINT "CommunityBookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostMedia" ADD CONSTRAINT "CommunityPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostSymbol" ADD CONSTRAINT "CommunityPostSymbol_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostSymbol" ADD CONSTRAINT "CommunityPostSymbol_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "CommunitySymbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFollow" ADD CONSTRAINT "CommunityFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFollow" ADD CONSTRAINT "CommunityFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityCategoryFollow" ADD CONSTRAINT "CommunityCategoryFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityCategoryFollow" ADD CONSTRAINT "CommunityCategoryFollow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommunityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySymbolFollow" ADD CONSTRAINT "CommunitySymbolFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySymbolFollow" ADD CONSTRAINT "CommunitySymbolFollow_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "CommunitySymbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
