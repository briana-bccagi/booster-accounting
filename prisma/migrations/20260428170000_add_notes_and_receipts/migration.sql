-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" 
FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE;