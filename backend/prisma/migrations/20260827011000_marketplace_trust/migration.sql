-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'reserved';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "meetup_ok" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Listing" ADD COLUMN     "delivery_ok" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN     "delivery_fee" DECIMAL(12,2);
ALTER TABLE "Listing" ADD COLUMN     "size" TEXT;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedListing" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_listing_id_reviewer_id_key" ON "Review"("listing_id", "reviewer_id");
CREATE INDEX "Review_seller_id_idx" ON "Review"("seller_id");
CREATE UNIQUE INDEX "SavedListing_user_id_listing_id_key" ON "SavedListing"("user_id", "listing_id");
CREATE INDEX "SavedListing_user_id_idx" ON "SavedListing"("user_id");

ALTER TABLE "Review" ADD CONSTRAINT "Review_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
