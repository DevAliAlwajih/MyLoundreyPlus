-- Seed default_commission_rate into app_settings
-- This value is used as the global fallback commission rate for laundries
-- that don't have a custom commission_rate set.
-- Can be updated later via the admin dashboard or directly in the database.

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'default_commission_rate',
  '10',
  'نسبة العمولة الافتراضية (%) — تُستخدم للمغاسل التي ليس لها نسبة خاصة'
)
ON CONFLICT (key) DO NOTHING;
