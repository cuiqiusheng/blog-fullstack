-- Add status and last-message semantics for chat session/message lifecycle.
CREATE TYPE "ChatSessionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ChatMessageStatus" AS ENUM ('STREAMING', 'COMPLETED', 'FAILED');

ALTER TABLE "chat_topics"
ADD COLUMN "status" "ChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "lastMessageAt" TIMESTAMP(3);

ALTER TABLE "chat_messages"
ADD COLUMN "status" "ChatMessageStatus" NOT NULL DEFAULT 'COMPLETED';

CREATE INDEX "chat_topics_userId_lastMessageAt_idx"
ON "chat_topics"("userId", "lastMessageAt");
