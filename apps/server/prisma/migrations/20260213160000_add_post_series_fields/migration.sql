-- Add stable series metadata for ordered reading.
ALTER TABLE "posts"
ADD COLUMN "seriesKey" TEXT,
ADD COLUMN "seriesOrder" INTEGER;

CREATE INDEX "posts_seriesKey_seriesOrder_idx" ON "posts"("seriesKey", "seriesOrder");
