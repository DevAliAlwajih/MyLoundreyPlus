-- =============================================================
--  MyLoundreyPlus — مراجعة قاعدة البيانات وملف الإصلاحات
--  يُشغَّل بعد الـ script الأصلي مباشرةً
-- =============================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════
--  الخطوة 1 — الـ ENUMs المفقودة (يجب أن تكون قبل الجداول)
--  المشكلة: الـ script الأصلي يستخدمها لكن لا يعرّفها
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('customer','laundry','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE laundry_status AS ENUM ('pending','trial','active','suspended','banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft','received','washing','ironing','ready','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_type AS ENUM ('cash','card','deferred','electronic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open','in_progress','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ticket_user_type AS ENUM ('customer','laundry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ad_target AS ENUM ('all','customers','laundries');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE service_type AS ENUM ('washing','ironing','washing_and_ironing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE processing_type AS ENUM ('normal','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
--  الخطوة 2 — إصلاح user_devices.id (DEFAULT مفقود — BUG)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.user_devices
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- ══════════════════════════════════════════════════════════════
--  الخطوة 3 — إضافة حقل google_id لجدول users (Google OAuth)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(200) UNIQUE;

COMMENT ON COLUMN public.users.google_id
    IS 'معرف حساب Google للمستخدمين المسجلين عبر Google OAuth';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 4 — إضافة اسم مخصص للجهاز (SRS v4 قسم 6.6)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.user_devices
    ADD COLUMN IF NOT EXISTS device_name VARCHAR(100);

COMMENT ON COLUMN public.user_devices.device_name
    IS 'اسم مخصص من المستخدم مثل: آيفون الشغل';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 5 — إضافة تسعير منفصل للغسيل والكوي (SRS v4 قسم 4.5)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.items
    ADD COLUMN IF NOT EXISTS washing_price NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS ironing_price NUMERIC(8,2);

COMMENT ON COLUMN public.items.washing_price IS 'سعر الغسيل فقط — مختلف عن سعر الكوي';
COMMENT ON COLUMN public.items.ironing_price IS 'سعر الكوي فقط — مختلف عن سعر الغسيل';
COMMENT ON COLUMN public.items.base_price    IS 'سعر الغسيل + الكوي معاً (الخدمة الكاملة)';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 6 — إضافة إعدادات الضريبة والاستعجال للمغسلة (SRS v4 قسم 4.5)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.laundries
    ADD COLUMN IF NOT EXISTS tax_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tax_rate          NUMERIC(5,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS urgency_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS urgency_fee       NUMERIC(8,2) DEFAULT 0.00;

COMMENT ON COLUMN public.laundries.tax_rate    IS 'نسبة الضريبة بالمئة — قابلة للتعديل';
COMMENT ON COLUMN public.laundries.urgency_fee IS 'رسوم الاستعجال بالقيمة الثابتة — قابلة للتعديل';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 7 — إضافة حقول العميل غير المسجل وتاريخ التسليم (SRS v4 قسم 4.3)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.invoices
    ADD COLUMN IF NOT EXISTS walk_in_name          VARCHAR(150),
    ADD COLUMN IF NOT EXISTS walk_in_phone         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS walk_in_location      TEXT,
    ADD COLUMN IF NOT EXISTS expected_delivery_at  TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS tax_amount            NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS urgency_fee           NUMERIC(10,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.invoices.walk_in_name  IS 'اسم العميل غير المسجل في التطبيق';
COMMENT ON COLUMN public.invoices.walk_in_phone IS 'رقم هاتف العميل غير المسجل';
COMMENT ON COLUMN public.invoices.expected_delivery_at IS 'تاريخ ووقت التسليم المتوقع';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 8 — إضافة حقول بنود الفاتورة (SRS v4 قسم 4.2)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.invoice_items
    ADD COLUMN IF NOT EXISTS item_name_ar     VARCHAR(150),
    ADD COLUMN IF NOT EXISTS item_name_en     VARCHAR(150),
    ADD COLUMN IF NOT EXISTS service_type     service_type NOT NULL DEFAULT 'washing_and_ironing',
    ADD COLUMN IF NOT EXISTS processing_type  processing_type NOT NULL DEFAULT 'normal';

-- نسخ القيمة الحالية لـ item_name إلى item_name_ar
UPDATE public.invoice_items
SET item_name_ar = item_name
WHERE item_name_ar IS NULL;

COMMENT ON COLUMN public.invoice_items.service_type    IS 'نوع الخدمة: غسيل / كوي / غسيل+كوي';
COMMENT ON COLUMN public.invoice_items.processing_type IS 'عادي أو مستعجل';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 9 — إضافة الموسمية لخطط الاشتراك (SRS v4 قسم 5.3)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.subscription_plans
    ADD COLUMN IF NOT EXISTS is_seasonal        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS occasion_name      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS discount_percent   NUMERIC(5,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS offer_valid_from   DATE,
    ADD COLUMN IF NOT EXISTS offer_valid_until  DATE;

COMMENT ON COLUMN public.subscription_plans.is_seasonal     IS 'هل هذه خطة موسمية (عيد / رمضان...)';
COMMENT ON COLUMN public.subscription_plans.occasion_name   IS 'اسم المناسبة مثل: العيد الوطني';
COMMENT ON COLUMN public.subscription_plans.discount_percent IS 'نسبة الخصم الموسمي';

-- ══════════════════════════════════════════════════════════════
--  الخطوة 10 — CHECK Constraints المفقودة
-- ══════════════════════════════════════════════════════════════

-- النجوم بين 1 و 5 فقط
ALTER TABLE IF EXISTS public.ratings
    DROP CONSTRAINT IF EXISTS chk_stars,
    ADD CONSTRAINT chk_stars CHECK (stars BETWEEN 1 AND 5);

-- الكمية موجبة دائماً
ALTER TABLE IF EXISTS public.invoice_items
    DROP CONSTRAINT IF EXISTS chk_quantity_positive,
    ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0);

-- المدفوع لا يتجاوز الإجمالي
ALTER TABLE IF EXISTS public.invoices
    DROP CONSTRAINT IF EXISTS chk_paid_not_exceed,
    ADD CONSTRAINT chk_paid_not_exceed CHECK (paid_amount <= total_amount + tax_amount + urgency_fee);

-- الضريبة والاستعجال لا تكون سالبة
ALTER TABLE IF EXISTS public.invoices
    DROP CONSTRAINT IF EXISTS chk_tax_positive,
    ADD CONSTRAINT chk_tax_positive CHECK (tax_amount >= 0 AND urgency_fee >= 0);

ALTER TABLE IF EXISTS public.laundries
    DROP CONSTRAINT IF EXISTS chk_tax_rate,
    ADD CONSTRAINT chk_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- ══════════════════════════════════════════════════════════════
--  الخطوة 11 — الجداول الناقصة
-- ══════════════════════════════════════════════════════════════

-- 11.1 جدول الحجوزات (SRS v4 — نظام الحجز المسبق)
CREATE TABLE IF NOT EXISTS public.bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laundry_id          UUID NOT NULL REFERENCES public.laundries(id) ON DELETE CASCADE,
    customer_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    booking_date        DATE NOT NULL,
    booking_time        TIME NOT NULL,
    notes               TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','rejected','cancelled','completed')),
    invoice_id          UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_laundry  ON public.bookings(laundry_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);

COMMENT ON TABLE public.bookings IS 'حجوزات المواعيد المسبقة — يُربط بفاتورة عند التنفيذ';

-- 11.2 جدول رسائل المحادثة
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laundry_id      UUID REFERENCES public.laundries(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
    admin_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message         TEXT,
    attachment_url  TEXT,
    attachment_type VARCHAR(20) CHECK (attachment_type IN ('image','pdf',NULL)),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- أحد الحالتين إلزامي: محادثة عميل-مغسلة أو محادثة مع الإدارة
    CONSTRAINT chk_chat_participants CHECK (
        (laundry_id IS NOT NULL AND customer_id IS NOT NULL AND admin_id IS NULL) OR
        (admin_id IS NOT NULL AND (customer_id IS NOT NULL OR laundry_id IS NOT NULL))
    )
);

CREATE INDEX IF NOT EXISTS idx_chat_conv
    ON public.chat_messages(laundry_id, customer_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_admin
    ON public.chat_messages(admin_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_unread
    ON public.chat_messages(sender_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE public.chat_messages
    IS 'محادثات: عميل↔مغسلة | عميل↔إدارة | مغسلة↔إدارة';

-- 11.3 جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS public.app_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    description TEXT,
    updated_by  UUID REFERENCES public.users(id),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- القيم الافتراضية
INSERT INTO public.app_settings (key, value, description) VALUES
    ('support_phone_sa',       '+966500000000', 'رقم الدعم الفني — السعودية'),
    ('support_phone_ae',       '+971500000000', 'رقم الدعم الفني — الإمارات'),
    ('support_phone_ye',       '+967700000000', 'رقم الدعم الفني — اليمن'),
    ('support_whatsapp',       '+966500000000', 'رقم واتساب الدعم الفني'),
    ('trial_days',             '14',            'عدد أيام الفترة التجريبية'),
    ('max_devices_per_user',   '3',             'أقصى عدد أجهزة لكل مستخدم'),
    ('app_version_ios',        '1.0.0',         'أحدث إصدار iOS'),
    ('app_version_android',    '1.0.0',         'أحدث إصدار Android'),
    ('maintenance_mode',       'false',          'وضع الصيانة')
ON CONFLICT (key) DO NOTHING;

-- 11.4 جدول إحصاءات مشاهدات الإعلانات والعروض
CREATE TABLE IF NOT EXISTS public.promotion_views (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id    UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
    ad_id           UUID REFERENCES public.ads(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
    viewed_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_view_target CHECK (
        (promotion_id IS NOT NULL AND ad_id IS NULL) OR
        (ad_id IS NOT NULL AND promotion_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_promo_views ON public.promotion_views(promotion_id);
CREATE INDEX IF NOT EXISTS idx_ad_views    ON public.promotion_views(ad_id);

-- ══════════════════════════════════════════════════════════════
--  الخطوة 12 — الفهارس المفقودة
-- ══════════════════════════════════════════════════════════════

-- المستخدمون
CREATE INDEX IF NOT EXISTS idx_users_role       ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_google_id  ON public.users(google_id) WHERE google_id IS NOT NULL;

-- المغاسل
CREATE INDEX IF NOT EXISTS idx_laundries_status  ON public.laundries(status);
CREATE INDEX IF NOT EXISTS idx_laundries_rating  ON public.laundries(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_laundries_country ON public.laundries(country);
CREATE INDEX IF NOT EXISTS idx_laundries_location
    ON public.laundries(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- الفواتير
CREATE INDEX IF NOT EXISTS idx_invoices_laundry    ON public.invoices(laundry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer   ON public.invoices(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment    ON public.invoices(payment_type);
CREATE INDEX IF NOT EXISTS idx_invoices_due
    ON public.invoices(laundry_id, due_amount)
    WHERE due_amount > 0;
CREATE INDEX IF NOT EXISTS idx_invoices_delivery
    ON public.invoices(laundry_id, expected_delivery_at)
    WHERE expected_delivery_at IS NOT NULL;

-- سجل الحالات
CREATE INDEX IF NOT EXISTS idx_status_log_invoice
    ON public.invoice_status_log(invoice_id, changed_at DESC);

-- الإشعارات
CREATE INDEX IF NOT EXISTS idx_notif_user
    ON public.notifications(user_id, is_read, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread
    ON public.notifications(user_id) WHERE is_read = FALSE;

-- الاشتراكات
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
    ON public.subscriptions(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end
    ON public.subscriptions(end_date) WHERE is_active = TRUE;

-- الأجهزة
CREATE INDEX IF NOT EXISTS idx_devices_user
    ON public.user_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_devices_primary
    ON public.user_devices(user_id) WHERE is_primary = TRUE;

-- ══════════════════════════════════════════════════════════════
--  الخطوة 13 — الـ Triggers الأساسية
-- ══════════════════════════════════════════════════════════════

-- 13.1 تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','laundries','categories','items','invoices',
    'promotions','ads','support_tickets','user_devices',
    'subscription_plans','app_settings','bookings'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON public.%I;
      CREATE TRIGGER trg_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- 13.2 توليد رقم الفاتورة تلقائياً
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'MLP-' || TO_CHAR(NOW(),'YYYY') || '-' ||
                          LPAD(NEXTVAL('invoice_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_invoice_number ON public.invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- 13.3 تسجيل تغيير حالة الفاتورة + State Machine
CREATE OR REPLACE FUNCTION trigger_invoice_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE allowed TEXT[];
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    allowed := CASE OLD.status
      WHEN 'draft'     THEN ARRAY['received','cancelled']
      WHEN 'received'  THEN ARRAY['washing','cancelled']
      WHEN 'washing'   THEN ARRAY['ironing','cancelled']
      WHEN 'ironing'   THEN ARRAY['ready','cancelled']
      WHEN 'ready'     THEN ARRAY['completed','cancelled']
      WHEN 'completed' THEN ARRAY['cancelled']
      WHEN 'cancelled' THEN ARRAY['received']
      ELSE ARRAY[]::TEXT[]
    END;
    IF NOT (NEW.status::TEXT = ANY(allowed)) THEN
      RAISE EXCEPTION 'انتقال غير مسموح: % → % للفاتورة %',
        OLD.status, NEW.status, NEW.invoice_number
        USING ERRCODE = 'check_violation';
    END IF;
    INSERT INTO public.invoice_status_log
      (invoice_id, changed_by, old_status, new_status)
    VALUES (NEW.id, NEW.customer_id, OLD.status, NEW.status);
    IF NEW.status = 'completed' THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_invoice_status ON public.invoices;
CREATE TRIGGER trg_invoice_status
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_invoice_status();

-- 13.4 تحديث متوسط تقييم المغسلة
CREATE OR REPLACE FUNCTION trigger_update_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE lid UUID;
BEGIN
  lid := COALESCE(NEW.laundry_id, OLD.laundry_id);
  UPDATE public.laundries SET
    rating_avg   = COALESCE((SELECT ROUND(AVG(stars)::NUMERIC,2)
                             FROM public.ratings WHERE laundry_id = lid),0),
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE laundry_id = lid)
  WHERE id = lid;
  RETURN COALESCE(NEW,OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_rating ON public.ratings;
CREATE TRIGGER trg_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION trigger_update_rating();

-- 13.5 ضمان جهاز أساسي واحد فقط
CREATE OR REPLACE FUNCTION trigger_single_primary()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE public.user_devices
    SET is_primary = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_single_primary ON public.user_devices;
CREATE TRIGGER trg_single_primary
  AFTER INSERT OR UPDATE OF is_primary ON public.user_devices
  FOR EACH ROW WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION trigger_single_primary();

-- ══════════════════════════════════════════════════════════════
--  الخطوة 14 — Views مفيدة
-- ══════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_daily_laundry_summary CASCADE;
CREATE VIEW public.v_daily_laundry_summary AS
SELECT
  laundry_id,
  DATE(created_at AT TIME ZONE 'Asia/Riyadh')             AS report_date,
  COUNT(*)                                                 AS total_invoices,
  COUNT(*) FILTER (WHERE status='completed')               AS completed_count,
  COUNT(*) FILTER (WHERE status='cancelled')               AS cancelled_count,
  COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled')) AS active_count,
  COALESCE(SUM(total_amount+tax_amount+urgency_fee)
    FILTER (WHERE status!='cancelled'),0)                  AS total_revenue,
  COALESCE(SUM(total_amount+tax_amount+urgency_fee)
    FILTER (WHERE payment_type='cash' AND status!='cancelled'),0)       AS cash_revenue,
  COALESCE(SUM(total_amount+tax_amount+urgency_fee)
    FILTER (WHERE payment_type='card' AND status!='cancelled'),0)       AS card_revenue,
  COALESCE(SUM(total_amount+tax_amount+urgency_fee)
    FILTER (WHERE payment_type='deferred' AND status!='cancelled'),0)   AS deferred_revenue,
  COALESCE(SUM(total_amount+tax_amount+urgency_fee)
    FILTER (WHERE payment_type='electronic' AND status!='cancelled'),0) AS electronic_revenue,
  COALESCE(SUM(due_amount) FILTER (WHERE status!='cancelled'),0)        AS total_unpaid
FROM public.invoices
GROUP BY laundry_id, DATE(created_at AT TIME ZONE 'Asia/Riyadh');

DROP VIEW IF EXISTS public.v_customer_debts CASCADE;
CREATE VIEW public.v_customer_debts AS
SELECT
  i.laundry_id, l.name AS laundry_name,
  i.customer_id,
  COALESCE(u.full_name, i.walk_in_name) AS customer_name,
  COALESCE(u.phone_number, i.walk_in_phone) AS customer_phone,
  COUNT(i.id) AS invoice_count,
  SUM(i.due_amount) AS total_debt,
  MAX(i.created_at) AS last_invoice_date
FROM public.invoices i
LEFT JOIN public.users u ON u.id = i.customer_id
JOIN public.laundries l ON l.id = i.laundry_id
WHERE i.due_amount > 0 AND i.status != 'cancelled'
GROUP BY i.laundry_id, l.name, i.customer_id, u.full_name, i.walk_in_name,
         u.phone_number, i.walk_in_phone
ORDER BY total_debt DESC;

DROP VIEW IF EXISTS public.v_expiring_subscriptions CASCADE;
CREATE VIEW public.v_expiring_subscriptions AS
SELECT
  s.id, s.laundry_id, l.name AS laundry_name,
  l.phone_number, u.full_name AS owner_name,
  sp.name_ar AS plan_name, s.end_date,
  (s.end_date - CURRENT_DATE) AS days_remaining
FROM public.subscriptions s
JOIN public.laundries l ON l.id = s.laundry_id
JOIN public.users u ON u.id = l.owner_id
JOIN public.subscription_plans sp ON sp.id = s.plan_id
WHERE s.is_active = TRUE
  AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

DROP VIEW IF EXISTS public.v_invoice_status CASCADE;
CREATE VIEW public.v_invoice_status AS
SELECT
  i.id, i.invoice_number, i.laundry_id,
  i.status,
  COALESCE(u.full_name, i.walk_in_name) AS customer_name,
  COALESCE(u.phone_number, i.walk_in_phone) AS customer_phone,
  (total_amount + tax_amount + urgency_fee) AS grand_total,
  i.due_amount, i.payment_type,
  i.expected_delivery_at,
  i.created_at, i.completed_at,
  CASE
    WHEN i.status = 'completed' THEN 'تم التسليم'
    WHEN i.status = 'cancelled' THEN 'ملغي'
    WHEN i.status = 'ready'     THEN 'جاهز للاستلام'
    ELSE 'قيد التجهيز'
  END AS status_label_ar
FROM public.invoices i
LEFT JOIN public.users u ON u.id = i.customer_id;

-- ══════════════════════════════════════════════════════════════
--  تحقق نهائي
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE v_tables INT; v_triggers INT; v_views INT;
BEGIN
  SELECT COUNT(*) INTO v_tables   FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE';
  SELECT COUNT(*) INTO v_triggers FROM information_schema.triggers
    WHERE trigger_schema='public';
  SELECT COUNT(*) INTO v_views    FROM information_schema.views
    WHERE table_schema='public';
  RAISE NOTICE '=== MyLoundreyPlus DB — تم تطبيق الإصلاحات ===';
  RAISE NOTICE 'الجداول  : %', v_tables;
  RAISE NOTICE 'Triggers : %', v_triggers;
  RAISE NOTICE 'Views    : %', v_views;
END $$;

COMMIT;
