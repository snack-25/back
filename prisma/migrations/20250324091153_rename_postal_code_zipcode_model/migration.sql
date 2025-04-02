/*
  Warnings:

  - You are about to drop the column `zipcode` on the `zipcodes` table. All the data in the column will be lost.
  - Added the required column `postalCode` to the `zipcodes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "zipcodes_zipcode_idx";

-- AlterTable
ALTER TABLE "zipcodes" DROP COLUMN "zipcode",
ADD COLUMN     "postalCode" CHAR(5) NOT NULL;

-- CreateIndex
CREATE INDEX "zipcodes_postalCode_idx" ON "zipcodes"("postalCode");
