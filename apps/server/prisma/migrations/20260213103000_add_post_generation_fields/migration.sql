-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "posts"
ADD COLUMN "topic" TEXT,
ADD COLUMN "subtopic" TEXT,
ADD COLUMN "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "source" TEXT,
ADD COLUMN "wordCount" INTEGER,
ADD COLUMN "generationBatchId" TEXT,
ADD COLUMN "generationPrompt" TEXT,
ADD COLUMN "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "posts_topic_subtopic_status_idx" ON "posts"("topic", "subtopic", "status");

-- CreateIndex
CREATE INDEX "posts_generationBatchId_idx" ON "posts"("generationBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "posts_contentHash_key" ON "posts"("contentHash");
