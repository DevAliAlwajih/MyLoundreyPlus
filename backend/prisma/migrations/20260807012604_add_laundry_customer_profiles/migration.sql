-- DropForeignKey
ALTER TABLE "laundry_holidays" DROP CONSTRAINT "laundry_holidays_laundry_id_fkey";

-- CreateTable
CREATE TABLE "laundry_customer_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID NOT NULL,
    "customer_id" UUID,
    "phone" VARCHAR(20),
    "local_name" VARCHAR(150),
    "local_phone" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laundry_customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laundry_customer_profiles_laundry_id_customer_id_key" ON "laundry_customer_profiles"("laundry_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_customer_profiles_laundry_id_phone_key" ON "laundry_customer_profiles"("laundry_id", "phone");

-- AddForeignKey
ALTER TABLE "laundry_holidays" ADD CONSTRAINT "laundry_holidays_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_customer_profiles" ADD CONSTRAINT "laundry_customer_profiles_laundry_id_fkey" FOREIGN KEY ("laundry_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_customer_profiles" ADD CONSTRAINT "laundry_customer_profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
