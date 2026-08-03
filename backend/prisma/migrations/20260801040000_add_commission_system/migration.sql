-- ════════════════════════════════════════════════════
-- Migration: Commission System — Phase A
-- Date: 2026-08-01
-- Description:
--   1. Add billing_type enum
--   2. Add commission fields to laundries table
--   3. Create commission_transactions table
-- ════════════════════════════════════════════════════

-- 1. إنشاء enum نوع الفوترة
CREATE TYPE "billing_type" AS ENUM ('subscription', 'commission');

-- 2. إضافة حقول العمولة لجدول laundries
ALTER TABLE "laundries"
  ADD COLUMN "billing_type"              "billing_type" NOT NULL DEFAULT 'subscription',
  ADD COLUMN "commission_rate"           DECIMAL(5,2)  NULL,
  ADD COLUMN "trial_commission_ends_at"  TIMESTAMPTZ   NULL,
  ADD COLUMN "balance"                   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "debt_limit"                DECIMAL(10,2) NULL;

-- 3. إنشاء جدول حركات العمولة
CREATE TABLE "commission_transactions" (
    "id"                UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id"        UUID          NOT NULL,
    "invoice_id"        UUID          NOT NULL,
    "invoice_total"     DECIMAL(10,2) NOT NULL,
    "commission_rate"   DECIMAL(5,2)  NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "balance_after"     DECIMAL(10,2) NOT NULL,
    "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT "commission_transactions_pkey" PRIMARY KEY ("id")
);

-- 4. إضافة العلاقات (Foreign Keys)
ALTER TABLE "commission_transactions"
  ADD CONSTRAINT "commission_transactions_laundry_id_fkey"
    FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "commission_transactions_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT;

-- 5. الـ Indexes لتحسين الأداء
CREATE INDEX "idx_commission_laundry" ON "commission_transactions"("laundry_id", "created_at" DESC);
CREATE INDEX "idx_commission_invoice" ON "commission_transactions"("invoice_id");
