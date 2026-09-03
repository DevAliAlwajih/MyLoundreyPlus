-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('charge', 'refund');

-- AlterTable
ALTER TABLE "commission_transactions" ADD COLUMN     "type" "transaction_type" NOT NULL DEFAULT 'charge';
