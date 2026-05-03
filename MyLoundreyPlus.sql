SET client_encoding = 'UTF8';
-- =============================================================
--  مغسلتي اس بلس — Maghsalati S Plus
--  PostgreSQL Database Schema v1.0
--  قاعدة بيانات كاملة مع Enums و Indexes و Constraints
-- =============================================================

-- تفعيل امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- للبحث النصي السريع


-- =============================================================
--  ENUMS — القيم المحددة المسبقاً
-- =============================================================

CREATE TYPE user_role AS ENUM (
    'customer',    -- عميل
    'laundry',     -- صاحب مغسلة
    'admin'        -- مدير النظام
);

CREATE TYPE laundry_status AS ENUM (
    'pending',     -- بانتظار الموافقة
    'trial',       -- فترة تجريبية
    'active',      -- اشتراك فعّال
    'suspended',   -- موقوف (انتهى اشتراكه)
    'banned'       -- محظور
);

CREATE TYPE subscription_plan AS ENUM (
    'trial',       -- تجريبي مجاني
    'monthly',     -- شهري
    'yearly'       -- سنوي
);

CREATE TYPE invoice_status AS ENUM (
    'draft',       -- مسودة (لم تُرسَل للعميل بعد)
    'received',    -- تم الاستلام
    'washing',     -- قيد الغسيل
    'ironing',     -- قيد الكوي
    'ready',       -- جاهز للاستلام
    'completed',   -- مكتمل — يُفتح التقييم هنا
    'cancelled'    -- ملغي
);

CREATE TYPE payment_type AS ENUM (
    'cash',        -- نقدي
    'card',        -- شبكة / بطاقة
    'deferred'     -- آجل
);

CREATE TYPE ticket_status AS ENUM (
    'open',        -- مفتوح
    'in_progress', -- قيد المعالجة
    'resolved',    -- تم الحل
    'closed'       -- مغلق
);

CREATE TYPE ticket_user_type AS ENUM (
    'customer',    -- من عميل
    'laundry'      -- من مغسلة
);

CREATE TYPE ad_target AS ENUM (
    'all',         -- للجميع
    'customers',   -- للعملاء فقط
    'laundries'    -- للمغاسل فقط
);


-- =============================================================
--  USERS — المستخدمون (عملاء + أصحاب مغاسل + مدراء)
-- =============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20) NOT NULL UNIQUE,
    unique_id       VARCHAR(12) NOT NULL UNIQUE,  -- معرف فريد يظهر في QR
    qr_code         TEXT,                          -- QR Code كـ base64 أو URL
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'customer',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE, -- بعد تأكيد OTP
    last_login_at   TIMESTAMP WITH TIME ZONE,
    device_token    TEXT,                          -- FCM device token للإشعارات
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- فهارس جدول المستخدمين
CREATE INDEX idx_users_phone       ON users(phone_number);
CREATE INDEX idx_users_unique_id   ON users(unique_id);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_users_is_active   ON users(is_active);

-- تعليق توضيحي
COMMENT ON TABLE  users                 IS 'جميع مستخدمي النظام: عملاء، أصحاب مغاسل، مدراء';
COMMENT ON COLUMN users.unique_id       IS 'معرف فريد قصير يُستخدم لإنشاء فاتورة أو مسح QR';
COMMENT ON COLUMN users.device_token    IS 'رمز جهاز Firebase لإرسال الإشعارات الفورية';


-- =============================================================
--  LAUNDRIES — المغاسل
-- =============================================================

CREATE TABLE laundries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name            VARCHAR(150) NOT NULL,
    phone_number    VARCHAR(20) NOT NULL,    -- رقم للعملاء (يختلف عن رقم المالك)
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(10) DEFAULT 'SA', -- SA, AE, KW, YE...
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    working_hours   JSONB,                   -- {"sat":{"open":"08:00","close":"22:00"}, ...}
    logo_url        TEXT,
    status          laundry_status NOT NULL DEFAULT 'pending',
    rating_avg      DECIMAL(3, 2) DEFAULT 0.00,
    rating_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_laundries_owner       ON laundries(owner_id);
CREATE INDEX idx_laundries_status      ON laundries(status);
CREATE INDEX idx_laundries_location    ON laundries(latitude, longitude); -- للبحث بالقرب
CREATE INDEX idx_laundries_rating      ON laundries(rating_avg DESC);
CREATE INDEX idx_laundries_name_trgm   ON laundries USING gin(name gin_trgm_ops); -- بحث نصي

COMMENT ON COLUMN laundries.working_hours IS 'مثال: {"sun":{"open":"08:00","close":"22:00","closed":false}}';
COMMENT ON COLUMN laundries.rating_avg    IS 'يُحدَّث تلقائياً عبر trigger عند إضافة تقييم جديد';


-- =============================================================
--  USER_DEVICES — أجهزة المستخدمين للمصادقة المتعددة
-- =============================================================

CREATE TABLE user_devices (
    id              UUID PRIMARY KEY, -- Device ID (UUID from frontend)
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type     VARCHAR(50),
    device_os       VARCHAR(50),
    device_model    VARCHAR(100),
    fcm_token       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id, is_active);

-- =============================================================
--  SUBSCRIPTION_PLANS — خطط الاشتراكات
-- =============================================================

CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar         VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100) NOT NULL,
    duration_days   INTEGER NOT NULL,
    price_sar       DECIMAL(10, 2) NOT NULL,
    features        JSONB,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SUBSCRIPTIONS — اشتراكات المغاسل
-- =============================================================

CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laundry_id      UUID NOT NULL REFERENCES laundries(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    amount_paid     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method  VARCHAR(50) DEFAULT 'manual',
    promo_code      VARCHAR(50),
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_by      UUID REFERENCES users(id), -- المدير الذي أنشأ الاشتراك
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_laundry    ON subscriptions(laundry_id);
CREATE INDEX idx_subscriptions_active     ON subscriptions(is_active, end_date);
CREATE INDEX idx_subscriptions_end_date   ON subscriptions(end_date); -- للتنبيه قبل الانتهاء

COMMENT ON TABLE subscriptions IS 'يمكن أن يكون لكل مغسلة أكثر من سجل (تاريخ اشتراكات)';


-- =============================================================
--  CATEGORIES — أقسام قائمة المغسلة (رجالي، نسائي...)
-- =============================================================

CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laundry_id      UUID NOT NULL REFERENCES laundries(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (laundry_id, name) -- لا يوجد قسمان بنفس الاسم في نفس المغسلة
);

CREATE INDEX idx_categories_laundry ON categories(laundry_id, sort_order);


-- =============================================================
--  ITEMS — الأصناف داخل كل قسم (ثوب كوي، شرت غسيل...)
-- =============================================================

CREATE TABLE items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_ar         VARCHAR(150) NOT NULL,
    name_en         VARCHAR(150) NOT NULL,
    base_price      DECIMAL(8, 2) NOT NULL CHECK (base_price >= 0),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_category  ON items(category_id);

-- =============================================================
--  LAUNDRY_PRICES — التسعيرة المخصصة لكل مغسلة
-- =============================================================

CREATE TABLE laundry_prices (
    laundry_id      UUID NOT NULL REFERENCES laundries(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price           DECIMAL(8, 2) NOT NULL CHECK (price >= 0),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (laundry_id, item_id)
);


-- =============================================================
--  INVOICES — الفواتير (قلب النظام)
-- =============================================================

CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number  VARCHAR(20) NOT NULL UNIQUE, -- مثال: LAU-2025-000001
    laundry_id      UUID NOT NULL REFERENCES laundries(id) ON DELETE RESTRICT,
    customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          invoice_status NOT NULL DEFAULT 'received',
    payment_type    payment_type NOT NULL DEFAULT 'cash',

    -- المبالغ
    subtotal        DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount        DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    due_amount      DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

    -- ملاحظات
    notes           TEXT,

    -- تواريخ
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE,   -- وقت اكتمال الفاتورة

    -- قيود
    CONSTRAINT chk_paid_not_exceed_total CHECK (paid_amount <= total_amount),
    CONSTRAINT chk_total_positive        CHECK (total_amount >= 0)
);

CREATE INDEX idx_invoices_laundry     ON invoices(laundry_id, created_at DESC);
CREATE INDEX idx_invoices_customer    ON invoices(customer_id, created_at DESC);
CREATE INDEX idx_invoices_status      ON invoices(status);
CREATE INDEX idx_invoices_payment     ON invoices(payment_type);
CREATE INDEX idx_invoices_number      ON invoices(invoice_number);
CREATE INDEX idx_invoices_due         ON invoices(laundry_id, due_amount) WHERE due_amount > 0;

COMMENT ON COLUMN invoices.due_amount      IS 'عمود محسوب تلقائياً: total - paid (للآجل)';
COMMENT ON COLUMN invoices.invoice_number  IS 'رقم تسلسلي مُنسق: LAU-{YYYY}-{000000}';


-- =============================================================
--  INVOICE_ITEMS — بنود الفاتورة
-- =============================================================

CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id         UUID REFERENCES items(id) ON DELETE SET NULL, -- قد يُحذف الصنف لاحقاً
    item_name       VARCHAR(150) NOT NULL,  -- نسخة محفوظة من اسم الصنف وقت الفاتورة
    unit_price      DECIMAL(8, 2) NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal        DECIMAL(10, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

COMMENT ON COLUMN invoice_items.item_name  IS 'مخزّن كنص ثابت حتى لو تغيّر اسم الصنف لاحقاً';
COMMENT ON COLUMN invoice_items.unit_price IS 'مخزّن كقيمة ثابتة حتى لو تغيّر السعر لاحقاً';


-- =============================================================
--  INVOICE_STATUS_LOG — سجل تغييرات حالة الفاتورة
-- =============================================================

CREATE TABLE invoice_status_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    changed_by      UUID NOT NULL REFERENCES users(id),
    old_status      invoice_status,
    new_status      invoice_status NOT NULL,
    note            TEXT,
    changed_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_log_invoice ON invoice_status_log(invoice_id, changed_at DESC);

COMMENT ON TABLE invoice_status_log IS 'سجل تدقيقي كامل لكل تغيير في حالة الفاتورة';


-- =============================================================
--  RATINGS — التقييمات (تُفتح فقط عند اكتمال الفاتورة)
-- =============================================================

CREATE TABLE ratings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    laundry_id      UUID NOT NULL REFERENCES laundries(id) ON DELETE CASCADE,
    stars           SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- ضمان: لا يمكن للعميل تقييم إلا إذا كان هو صاحب الفاتورة
    UNIQUE (invoice_id, customer_id)
);

CREATE INDEX idx_ratings_laundry  ON ratings(laundry_id, created_at DESC);
CREATE INDEX idx_ratings_customer ON ratings(customer_id);

COMMENT ON COLUMN ratings.invoice_id IS 'UNIQUE يضمن تقييماً واحداً فقط لكل فاتورة';


-- =============================================================
--  PROMOTIONS — عروض المغاسل
-- =============================================================

CREATE TABLE promotions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laundry_id      UUID NOT NULL REFERENCES laundries(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    image_url       TEXT,
    start_date      DATE,
    end_date        DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promotions_laundry ON promotions(laundry_id, is_active);
CREATE INDEX idx_promotions_dates   ON promotions(start_date, end_date) WHERE is_active = TRUE;


-- =============================================================
--  ADS — الإعلانات (تُدار من لوحة الإدارة)
-- =============================================================

CREATE TABLE ads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL,
    media_urls      JSONB NOT NULL,         -- مصفوفة تحتوي روابط الصور والفيديوهات ["url1.jpg", "url2.mp4"]
    body_text       TEXT,
    link_url        TEXT,
    target_audience ad_target NOT NULL DEFAULT 'all',
    sort_order      INTEGER DEFAULT 0,
    start_date      DATE,
    end_date        DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ads_active  ON ads(is_active, target_audience, sort_order);


-- =============================================================
--  SUPPORT_TICKETS — تذاكر الدعم الفني
-- =============================================================

CREATE TABLE support_tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type       ticket_user_type NOT NULL,
    subject         VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    admin_reply     TEXT,
    status          ticket_status NOT NULL DEFAULT 'open',
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user    ON support_tickets(user_id);
CREATE INDEX idx_tickets_status  ON support_tickets(status, created_at DESC);


-- =============================================================
--  NOTIFICATIONS — سجل الإشعارات المُرسلة
-- =============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    type            VARCHAR(50),         -- 'invoice_status', 'new_rating', 'promo'...
    reference_id    UUID,               -- invoice_id أو promotion_id المرتبط
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user     ON notifications(user_id, is_read, sent_at DESC);
CREATE INDEX idx_notif_ref      ON notifications(reference_id);


-- =============================================================
--  PROMO_CODES — أكواد الخصم
-- =============================================================

CREATE TABLE promo_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    discount_type   VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value  DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    max_uses        INTEGER,            -- NULL = غير محدود
    used_count      INTEGER NOT NULL DEFAULT 0,
    valid_from      DATE,
    valid_until     DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_code    ON promo_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_promo_dates   ON promo_codes(valid_from, valid_until);


-- =============================================================
--  TRIGGERS — وظائف تلقائية
-- =============================================================

-- 1. تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_laundries
    BEFORE UPDATE ON laundries
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_invoices
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_items
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- 2. تسجيل تغيير حالة الفاتورة تلقائياً في invoice_status_log
CREATE OR REPLACE FUNCTION trigger_log_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO invoice_status_log (invoice_id, changed_by, old_status, new_status)
        VALUES (NEW.id, NEW.customer_id, OLD.status, NEW.status);

        -- تحديث completed_at عند اكتمال الفاتورة
        IF NEW.status = 'completed' THEN
            NEW.completed_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_invoice_status_change
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION trigger_log_invoice_status();


-- 3. تحديث متوسط تقييم المغسلة تلقائياً عند إضافة تقييم
CREATE OR REPLACE FUNCTION trigger_update_laundry_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE laundries
    SET
        rating_avg   = (SELECT ROUND(AVG(stars)::NUMERIC, 2) FROM ratings WHERE laundry_id = NEW.laundry_id),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE laundry_id = NEW.laundry_id)
    WHERE id = NEW.laundry_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_laundry_rating_on_new
    AFTER INSERT OR UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION trigger_update_laundry_rating();


-- 4. توليد رقم الفاتورة التلقائي (LAU-2025-000001)
CREATE SEQUENCE invoice_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'LAU-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                              LPAD(NEXTVAL('invoice_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();


-- =============================================================
--  VIEWS — استعلامات جاهزة للاستخدام
-- =============================================================

-- ملخص يومي للمغسلة (للتقرير اليومي)
CREATE OR REPLACE VIEW v_daily_laundry_summary AS
SELECT
    laundry_id,
    DATE(created_at)                                    AS report_date,
    COUNT(*)                                            AS total_invoices,
    COALESCE(SUM(total_amount), 0)                      AS total_revenue,
    COALESCE(SUM(CASE WHEN payment_type = 'cash'     THEN total_amount END), 0) AS cash_total,
    COALESCE(SUM(CASE WHEN payment_type = 'card'     THEN total_amount END), 0) AS card_total,
    COALESCE(SUM(CASE WHEN payment_type = 'deferred' THEN total_amount END), 0) AS deferred_total,
    COALESCE(SUM(due_amount), 0)                        AS total_due
FROM invoices
WHERE status != 'cancelled'
GROUP BY laundry_id, DATE(created_at);

-- العملاء المديونون لكل مغسلة
CREATE OR REPLACE VIEW v_customer_debts AS
SELECT
    i.laundry_id,
    i.customer_id,
    u.full_name      AS customer_name,
    u.phone_number   AS customer_phone,
    COUNT(i.id)      AS invoice_count,
    SUM(i.due_amount) AS total_debt
FROM invoices i
JOIN users u ON u.id = i.customer_id
WHERE i.due_amount > 0 AND i.status != 'cancelled'
GROUP BY i.laundry_id, i.customer_id, u.full_name, u.phone_number;

-- المغاسل التي تنتهي اشتراكاتها خلال 7 أيام (للتنبيه)
CREATE OR REPLACE VIEW v_expiring_subscriptions AS
SELECT
    s.*,
    l.name           AS laundry_name,
    l.phone_number   AS laundry_phone,
    u.full_name      AS owner_name
FROM subscriptions s
JOIN laundries l ON l.id = s.laundry_id
JOIN users u     ON u.id = l.owner_id
WHERE s.is_active = TRUE
  AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';


-- =============================================================
--  SAMPLE DATA — بيانات تجريبية للاختبار
-- =============================================================

-- مستخدم مدير
INSERT INTO users (full_name, phone_number, unique_id, role, is_active, is_verified)
VALUES ('مدير النظام', '+966500000001', 'ADMIN00001', 'admin', TRUE, TRUE);

-- عميل تجريبي
INSERT INTO users (full_name, phone_number, unique_id, role, is_active, is_verified)
VALUES ('أحمد محمد', '+966511111111', 'CUS0000001', 'customer', TRUE, TRUE);

-- صاحب مغسلة تجريبي
INSERT INTO users (full_name, phone_number, unique_id, role, is_active, is_verified)
VALUES ('سالم العتيبي', '+966522222222', 'LND0000001', 'laundry', TRUE, TRUE);
