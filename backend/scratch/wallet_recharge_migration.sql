-- Migration: add_wallet_recharge
-- Creates wallet_recharges table for tracking manual balance top-ups

-- Create enum for payment methods
DO $$ BEGIN
  CREATE TYPE "payment_method_type" AS ENUM ('cash', 'bank_transfer', 'cheque', 'electronic', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create wallet_recharges table
CREATE TABLE IF NOT EXISTS "wallet_recharges" (
  "id"               UUID        NOT NULL DEFAULT uuid_generate_v4(),
  "laundry_id"       UUID        NOT NULL,
  "amount"           DECIMAL(10,2) NOT NULL,
  "balance_before"   DECIMAL(10,2) NOT NULL,
  "balance_after"    DECIMAL(10,2) NOT NULL,
  "payment_method"   "payment_method_type" NOT NULL DEFAULT 'cash',
  "reference_number" VARCHAR(100),
  "notes"            TEXT,
  "created_by"       UUID,
  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "wallet_recharges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_recharges_laundry_id_fkey" FOREIGN KEY ("laundry_id")
    REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "wallet_recharges_created_by_fkey" FOREIGN KEY ("created_by")
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create index
CREATE INDEX IF NOT EXISTS "idx_wallet_recharge_laundry"
  ON "wallet_recharges"("laundry_id", "created_at" DESC);
