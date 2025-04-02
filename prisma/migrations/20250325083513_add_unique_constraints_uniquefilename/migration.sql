/*
  Warnings:

  - You are about to alter the column `originalFileName` on the `s3objects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `uniqueFileName` on the `s3objects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `contentType` on the `s3objects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `imageUrl` on the `s3objects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - A unique constraint covering the columns `[uniqueFileName]` on the table `s3objects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "s3objects" ALTER COLUMN "originalFileName" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "uniqueFileName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "contentType" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "imageUrl" SET DATA TYPE VARCHAR(512);

-- CreateIndex
CREATE UNIQUE INDEX "s3objects_uniqueFileName_key" ON "s3objects"("uniqueFileName");
