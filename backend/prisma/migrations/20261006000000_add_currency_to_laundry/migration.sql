-- Migration: Add currency field to Laundry table
-- This supports automatic currency detection based on country code

-- 1. Add currency column to laundries table
ALTER TABLE "laundries" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10);

-- 2. Populate currency based on country code (auto-mapping)
UPDATE "laundries" SET "currency" = CASE
  WHEN "country" = 'SA' THEN 'SAR'
  WHEN "country" = 'AE' THEN 'AED'
  WHEN "country" = 'QA' THEN 'QAR'
  WHEN "country" = 'KW' THEN 'KWD'
  WHEN "country" = 'OM' THEN 'OMR'
  WHEN "country" = 'BH' THEN 'BHD'
  WHEN "country" = 'YE' THEN 'YER'
  WHEN "country" = 'JO' THEN 'JOD'
  WHEN "country" = 'EG' THEN 'EGP'
  WHEN "country" = 'MA' THEN 'MAD'
  WHEN "country" = 'TN' THEN 'TND'
  WHEN "country" = 'LY' THEN 'LYD'
  WHEN "country" = 'DZ' THEN 'DZD'
  WHEN "country" = 'SD' THEN 'SDG'
  WHEN "country" = 'IQ' THEN 'IQD'
  WHEN "country" = 'SY' THEN 'SYP'
  WHEN "country" = 'LB' THEN 'LBP'
  WHEN "country" = 'PS' THEN 'ILS'
  ELSE 'SAR'
END
WHERE "currency" IS NULL;

-- 3. Set default and make not null
ALTER TABLE "laundries" ALTER COLUMN "currency" SET DEFAULT 'SAR';
ALTER TABLE "laundries" ALTER COLUMN "currency" SET NOT NULL;
