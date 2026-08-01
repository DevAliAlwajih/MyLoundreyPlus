-- 1. Drop the global unique index
DROP INDEX IF EXISTS "invoices_invoice_number_key";

-- 2. Create the invoice_counters table
CREATE TABLE "invoice_counters" (
    "laundry_id" UUID NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("laundry_id")
);

-- 3. Add the compound unique index on (laundry_id, invoice_number)
CREATE UNIQUE INDEX "idx_invoice_laundry_number" 
ON "invoices"("laundry_id", "invoice_number");

-- 4. Add the foreign key constraint
ALTER TABLE "invoice_counters" 
ADD CONSTRAINT "invoice_counters_laundry_id_fkey" 
FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Data Migration: Initialize the counter for existing laundries
INSERT INTO "invoice_counters" ("laundry_id", "last_number")
SELECT
  "laundry_id",
  COALESCE(
    MAX(
      CAST(
        NULLIF(REGEXP_REPLACE("invoice_number", '\D', '', 'g'), '')
        AS INTEGER
      )
    ), 0
  )
FROM "invoices"
GROUP BY "laundry_id";
