-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "last_sync_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expireDate" TIMESTAMP(3) NOT NULL,
    "isAccountBound" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiscount" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "discount_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscount_user_id_discount_id_key" ON "UserDiscount"("user_id", "discount_id");

-- AddForeignKey
ALTER TABLE "UserDiscount" ADD CONSTRAINT "UserDiscount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscount" ADD CONSTRAINT "UserDiscount_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
