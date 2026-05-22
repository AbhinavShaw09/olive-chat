-- AlterTable
ALTER TABLE "InferenceLog" ADD COLUMN     "errorDetail" TEXT,
ADD COLUMN     "errorType" TEXT,
ADD COLUMN     "estimatedCostUsd" DOUBLE PRECISION,
ADD COLUMN     "finishReason" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'success',
ADD COLUMN     "systemFingerprint" TEXT;

-- CreateTable
CREATE TABLE "ExtractedMetadata" (
    "id" TEXT NOT NULL,
    "inferenceLogId" TEXT NOT NULL,
    "ttftMs" INTEGER,
    "apiLatencyMs" INTEGER,
    "processingMs" INTEGER,
    "modelVersion" TEXT,
    "modelFamily" TEXT,
    "userAgent" TEXT,
    "appVersion" TEXT,
    "environment" TEXT,
    "errorCategory" TEXT,
    "retryCount" INTEGER,
    "promptCostUsd" DOUBLE PRECISION,
    "completionCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtractedMetadata_inferenceLogId_key" ON "ExtractedMetadata"("inferenceLogId");

-- AddForeignKey
ALTER TABLE "ExtractedMetadata" ADD CONSTRAINT "ExtractedMetadata_inferenceLogId_fkey" FOREIGN KEY ("inferenceLogId") REFERENCES "InferenceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
