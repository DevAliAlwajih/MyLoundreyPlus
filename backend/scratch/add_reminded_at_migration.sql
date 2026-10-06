-- Migration: add_reminded_at_to_invoices
-- Purpose: Track the last time a delivery reminder was sent for each invoice,
--          so the hourly cron can skip invoices that were recently notified.

ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "reminded_at" TIMESTAMPTZ(6);

-- Optional: index to speed up cron query (filters on reminded_at and status)
CREATE INDEX IF NOT EXISTS "idx_invoices_reminded_at"
  ON "invoices"("reminded_at", "status")
  WHERE "status" NOT IN ('completed', 'cancelled');
