-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'payment_refunded';
ALTER TYPE "NotificationType" ADD VALUE 'funds_released';

-- CreateIndex
CREATE INDEX "Message_listing_id_idx" ON "Message"("listing_id");

-- CreateIndex
CREATE INDEX "Transaction_listing_id_status_idx" ON "Transaction"("listing_id", "status");

-- CreateIndex
CREATE INDEX "Transaction_buyer_id_idx" ON "Transaction"("buyer_id");

-- CreateIndex
CREATE INDEX "Transaction_seller_id_idx" ON "Transaction"("seller_id");
