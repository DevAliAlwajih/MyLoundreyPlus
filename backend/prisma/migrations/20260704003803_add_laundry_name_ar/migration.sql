CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "ad_target" AS ENUM ('all', 'customers', 'laundries');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'received', 'washing', 'ironing', 'ready', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "laundry_status" AS ENUM ('pending', 'trial', 'active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('cash', 'card', 'deferred', 'electronic');

-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('trial', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "ticket_user_type" AS ENUM ('customer', 'laundry');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('customer', 'laundry', 'admin');

-- CreateEnum
CREATE TYPE "processing_type" AS ENUM ('normal', 'urgent');

-- CreateEnum
CREATE TYPE "service_type" AS ENUM ('washing', 'ironing', 'washing_and_ironing');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20),
    "unique_id" VARCHAR(12) NOT NULL,
    "qr_code" TEXT,
    "avatar_url" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'customer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "device_token" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(255),
    "password_hash" TEXT,
    "country" VARCHAR(10) DEFAULT 'SA',
    "currency" VARCHAR(10) DEFAULT 'SAR',
    "google_id" VARCHAR(200),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laundries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "name_ar" VARCHAR(150),
    "phone_number" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(10) DEFAULT 'SA',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "working_hours" JSONB,
    "logo_url" TEXT,
    "status" "laundry_status" NOT NULL DEFAULT 'pending',
    "rating_avg" DECIMAL(3,2) DEFAULT 0.00,
    "rating_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tax_rate" DECIMAL(5,2) DEFAULT 0.00,
    "urgency_enabled" BOOLEAN NOT NULL DEFAULT false,
    "urgency_fee" DECIMAL(8,2) DEFAULT 0.00,

    CONSTRAINT "laundries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "device_type" VARCHAR(50),
    "device_os" VARCHAR(50),
    "device_model" VARCHAR(100),
    "fcm_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_name" VARCHAR(100),

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name_ar" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_sar" DECIMAL(10,2) NOT NULL,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_seasonal" BOOLEAN NOT NULL DEFAULT false,
    "occasion_name" VARCHAR(100),
    "discount_percent" DECIMAL(5,2) DEFAULT 0.00,
    "offer_valid_from" DATE,
    "offer_valid_until" DATE,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "payment_method" VARCHAR(50) DEFAULT 'manual',
    "promo_code" VARCHAR(50),
    "start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category_id" UUID NOT NULL,
    "name_ar" VARCHAR(150) NOT NULL,
    "name_en" VARCHAR(150) NOT NULL,
    "base_price" DECIMAL(8,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "washing_price" DECIMAL(8,2),
    "ironing_price" DECIMAL(8,2),

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laundry_prices" (
    "laundry_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laundry_prices_pkey" PRIMARY KEY ("laundry_id","item_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_number" VARCHAR(20) NOT NULL,
    "laundry_id" UUID NOT NULL,
    "customer_id" UUID,
    "status" "invoice_status" NOT NULL DEFAULT 'received',
    "payment_type" "payment_type" NOT NULL DEFAULT 'cash',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "due_amount" DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "walk_in_name" VARCHAR(150),
    "walk_in_phone" VARCHAR(20),
    "walk_in_location" TEXT,
    "expected_delivery_at" TIMESTAMPTZ(6),
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "urgency_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "item_id" UUID,
    "item_name" VARCHAR(150) NOT NULL,
    "unit_price" DECIMAL(8,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) GENERATED ALWAYS AS (unit_price * (quantity)::numeric) STORED,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_name_ar" VARCHAR(150),
    "item_name_en" VARCHAR(150),
    "service_type" "service_type" NOT NULL DEFAULT 'washing_and_ironing',
    "processing_type" "processing_type" NOT NULL DEFAULT 'normal',

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_status_log" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "old_status" "invoice_status",
    "new_status" "invoice_status" NOT NULL,
    "note" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "laundry_id" UUID NOT NULL,
    "stars" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(200) NOT NULL,
    "media_urls" JSONB NOT NULL,
    "body_text" TEXT,
    "link_url" TEXT,
    "target_audience" "ad_target" NOT NULL DEFAULT 'all',
    "sort_order" INTEGER DEFAULT 0,
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "user_type" "ticket_user_type" NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "admin_reply" TEXT,
    "status" "ticket_status" NOT NULL DEFAULT 'open',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "type" VARCHAR(50),
    "reference_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_type" VARCHAR(10) NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" DATE,
    "valid_until" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "booking_date" DATE NOT NULL,
    "booking_time" TIME(6) NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "invoice_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID,
    "customer_id" UUID,
    "admin_id" UUID,
    "sender_id" UUID NOT NULL,
    "message" TEXT,
    "attachment_url" TEXT,
    "attachment_type" VARCHAR(20),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_views" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "promotion_id" UUID,
    "ad_id" UUID,
    "user_id" UUID,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_unique_id_key" ON "users"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_phone" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_unique_id" ON "users"("unique_id");

-- CreateIndex
CREATE INDEX "idx_laundries_location" ON "laundries"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_laundries_name_trgm" ON "laundries" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_laundries_owner" ON "laundries"("owner_id");

-- CreateIndex
CREATE INDEX "idx_laundries_rating" ON "laundries"("rating_avg" DESC);

-- CreateIndex
CREATE INDEX "idx_laundries_status" ON "laundries"("status");

-- CreateIndex
CREATE INDEX "idx_laundries_country" ON "laundries"("country");

-- CreateIndex
CREATE INDEX "idx_user_devices_user" ON "user_devices"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_devices_user" ON "user_devices"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_subscriptions_active" ON "subscriptions"("is_active", "end_date");

-- CreateIndex
CREATE INDEX "idx_subscriptions_end_date" ON "subscriptions"("end_date");

-- CreateIndex
CREATE INDEX "idx_subscriptions_laundry" ON "subscriptions"("laundry_id");

-- CreateIndex
CREATE INDEX "idx_categories_laundry" ON "categories"("laundry_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_laundry_id_name_key" ON "categories"("laundry_id", "name");

-- CreateIndex
CREATE INDEX "idx_items_category" ON "items"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_invoices_customer" ON "invoices"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_invoices_laundry" ON "invoices"("laundry_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_invoices_number" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_invoices_payment" ON "invoices"("payment_type");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_status_log_invoice" ON "invoice_status_log"("invoice_id", "changed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_invoice_id_key" ON "ratings"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_ratings_customer" ON "ratings"("customer_id");

-- CreateIndex
CREATE INDEX "idx_ratings_laundry" ON "ratings"("laundry_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_invoice_id_customer_id_key" ON "ratings"("invoice_id", "customer_id");

-- CreateIndex
CREATE INDEX "idx_promotions_laundry" ON "promotions"("laundry_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_ads_active" ON "ads"("is_active", "target_audience", "sort_order");

-- CreateIndex
CREATE INDEX "idx_tickets_status" ON "support_tickets"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tickets_user" ON "support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "idx_notif_ref" ON "notifications"("reference_id");

-- CreateIndex
CREATE INDEX "idx_notif_user" ON "notifications"("user_id", "is_read", "sent_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "idx_promo_dates" ON "promo_codes"("valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "idx_bookings_customer" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "idx_bookings_laundry" ON "bookings"("laundry_id", "booking_date");

-- CreateIndex
CREATE INDEX "idx_chat_admin" ON "chat_messages"("admin_id", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "idx_chat_conv" ON "chat_messages"("laundry_id", "customer_id", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ad_views" ON "promotion_views"("ad_id");

-- CreateIndex
CREATE INDEX "idx_promo_views" ON "promotion_views"("promotion_id");

-- AddForeignKey
ALTER TABLE "laundries" ADD CONSTRAINT "laundries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "laundry_prices" ADD CONSTRAINT "laundry_prices_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "laundry_prices" ADD CONSTRAINT "laundry_prices_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_status_log" ADD CONSTRAINT "invoice_status_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_status_log" ADD CONSTRAINT "invoice_status_log_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotion_views" ADD CONSTRAINT "promotion_views_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotion_views" ADD CONSTRAINT "promotion_views_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotion_views" ADD CONSTRAINT "promotion_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
