-- Add chat topic/message persistence for AI chat history.
CREATE TYPE "ChatMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

CREATE TABLE "chat_topics" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,

  CONSTRAINT "chat_topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL,
  "role" "ChatMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "topicId" TEXT NOT NULL,

  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_topics_userId_updatedAt_idx" ON "chat_topics"("userId", "updatedAt");
CREATE INDEX "chat_messages_topicId_createdAt_idx" ON "chat_messages"("topicId", "createdAt");

ALTER TABLE "chat_topics"
ADD CONSTRAINT "chat_topics_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
ADD CONSTRAINT "chat_messages_topicId_fkey"
FOREIGN KEY ("topicId") REFERENCES "chat_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
