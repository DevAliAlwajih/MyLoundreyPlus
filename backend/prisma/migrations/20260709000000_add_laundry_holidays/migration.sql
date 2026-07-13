-- CreateTable
CREATE TABLE "laundry_holidays" (
    "id"         UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "laundry_id" UUID        NOT NULL,
    "date"       DATE        NOT NULL,
    "reason"     TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laundry_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_laundry_holiday_unique" ON "laundry_holidays"("laundry_id", "date");

-- AddForeignKey
ALTER TABLE "laundry_holidays"
    ADD CONSTRAINT "laundry_holidays_laundry_id_fkey"
    FOREIGN KEY ("laundry_id")
    REFERENCES "laundries"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
