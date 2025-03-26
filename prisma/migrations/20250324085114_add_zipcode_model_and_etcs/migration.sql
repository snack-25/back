-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('NOT_APPLICABLE', 'JEJU', 'ISOLATED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "salt" VARCHAR(255);

-- CreateTable
CREATE TABLE "zipcodes" (
    "id" TEXT NOT NULL,
    "zipcode" CHAR(5) NOT NULL,
    "feeType" "FeeType" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "juso" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "zipcodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zipcodes_zipcode_idx" ON "zipcodes"("zipcode");

-- CreateIndex
CREATE INDEX "zipcodes_juso_idx" ON "zipcodes"("juso");

-- CreateIndex
CREATE INDEX "zipcodes_feeType_idx" ON "zipcodes"("feeType");

-- CreateIndex
CREATE INDEX "products_description_idx" ON "products"("description");

-- CreateIndex
CREATE INDEX "products_createdById_idx" ON "products"("createdById");

-- CreateIndex
CREATE INDEX "products_updatedById_idx" ON "products"("updatedById");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
