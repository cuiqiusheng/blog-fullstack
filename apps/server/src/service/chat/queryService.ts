import { prisma } from '@/lib/prisma';
import { ChatSessionStatus } from '@/generated/prisma/client';
import { normalizeOptionalText } from '../shared/textNormalization';

export interface ListChatSessionsOptions {
  userId: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export async function listChatSessions(options: ListChatSessionsOptions) {
  const search = normalizeOptionalText(options.search);
  return prisma.chatTopic.findMany({
    where: {
      userId: options.userId,
      status: ChatSessionStatus.ACTIVE,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    take: options.limit ?? 50,
    skip: options.offset ?? 0,
  });
}

export async function getChatSessionById(id: string, userId: string) {
  return prisma.chatTopic.findFirst({
    where: {
      id,
      userId,
    },
  });
}

export async function listChatSessionMessages(
  sessionId: string,
  userId: string,
  limit?: number,
  offset?: number,
) {
  const session = await getChatSessionById(sessionId, userId);
  if (!session) {
    return null;
  }
  return prisma.chatMessage.findMany({
    where: { topicId: sessionId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: limit ?? undefined,
    skip: offset ?? undefined,
  });
}
