-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "is_edited" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "invoice_edit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "edited_by" UUID,
    "edit_reason" TEXT,
    "changes_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_edit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_invoice_edit_log" ON "invoice_edit_logs"("invoice_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "invoice_edit_logs" ADD CONSTRAINT "invoice_edit_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_edit_logs" ADD CONSTRAINT "invoice_edit_logs_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
