/*
  Warnings:

  - You are about to drop the column `address` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `zipcode` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "address",
DROP COLUMN "zipcode";

-- CreateTable
CREATE TABLE "company_addresses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "zipcodeId" TEXT NOT NULL,
    "postalCode" VARCHAR(5) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "feeType" "FeeType" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_addresses_companyId_idx" ON "company_addresses"("companyId");

-- CreateIndex
CREATE INDEX "company_addresses_zipcodeId_idx" ON "company_addresses"("zipcodeId");

-- CreateIndex
CREATE UNIQUE INDEX "company_addresses_companyId_key" ON "company_addresses"("companyId");

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_zipcodeId_fkey" FOREIGN KEY ("zipcodeId") REFERENCES "zipcodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
