-- CreateTable
CREATE TABLE "s3objects" (
    "id" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "uniqueFileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "s3objects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "s3objects_originalFileName_idx" ON "s3objects"("originalFileName");

-- CreateIndex
CREATE INDEX "s3objects_uniqueFileName_idx" ON "s3objects"("uniqueFileName");

-- CreateIndex
CREATE INDEX "s3objects_contentType_idx" ON "s3objects"("contentType");
