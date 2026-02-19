import { ChatMessageRole, ChatMessageStatus, ChatSessionStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeOptionalText, normalizeRequiredText } from '../shared/textNormalization';
import { generateSessionTitleFromMessages } from './titleService';

const DEFAULT_SESSION_TITLE = 'New Chat';

export async function startChatSession(userId: string, title?: string) {
  const normalizedTitle = normalizeOptionalText(title) ?? DEFAULT_SESSION_TITLE;
  return prisma.chatTopic.create({
    data: {
      userId,
      title: normalizedTitle,
      status: ChatSessionStatus.ACTIVE,
    },
  });
}

async function ensureSessionAccess(sessionId: string, userId: string) {
  return prisma.chatTopic.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });
}

async function ensureActiveSessionOwnership(sessionId: string, userId: string) {
  const session = await ensureSessionAccess(sessionId, userId);
  if (!session || session.status !== ChatSessionStatus.ACTIVE) {
    return null;
  }
  return session;
}

export async function sendChatMessageCommand(userId: string, sessionId: string, content: string) {
  const normalizedContent = normalizeRequiredText(content);
  if (!normalizedContent) {
    throw new Error('Message content cannot be empty');
  }
  const session = await ensureActiveSessionOwnership(sessionId, userId);
  if (!session) {
    return null;
  }
  const now = new Date();
  const [userMessage, assistantMessage, updatedSession] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        topicId: sessionId,
        role: ChatMessageRole.USER,
        status: ChatMessageStatus.COMPLETED,
        content: normalizedContent,
      },
    }),
    prisma.chatMessage.create({
      data: {
        topicId: sessionId,
        role: ChatMessageRole.ASSISTANT,
        status: ChatMessageStatus.STREAMING,
        content: '',
      },
    }),
    prisma.chatTopic.update({
      where: { id: sessionId },
      data: {
        lastMessageAt: now,
        updatedAt: now,
      },
    }),
  ]);
  return { session: updatedSession, userMessage, assistantMessage };
}

export async function renameChatSession(userId: string, sessionId: string, title: string) {
  const normalizedTitle = normalizeRequiredText(title);
  if (!normalizedTitle) {
    throw new Error('Session title cannot be empty');
  }
  const session = await ensureActiveSessionOwnership(sessionId, userId);
  if (!session) {
    return null;
  }
  return prisma.chatTopic.update({
    where: { id: sessionId },
    data: {
      title: normalizedTitle.slice(0, 80),
      updatedAt: new Date(),
    },
  });
}

export async function archiveChatSession(userId: string, sessionId: string) {
  const session = await ensureActiveSessionOwnership(sessionId, userId);
  if (!session) {
    return null;
  }
  return prisma.chatTopic.update({
    where: { id: sessionId },
    data: {
      status: ChatSessionStatus.ARCHIVED,
      updatedAt: new Date(),
    },
  });
}

export async function deleteChatSession(userId: string, sessionId: string) {
  const session = await ensureSessionAccess(sessionId, userId);
  if (!session) {
    return false;
  }
  await prisma.chatTopic.delete({
    where: { id: sessionId },
  });
  return true;
}

export async function maybeGenerateSessionTitle(userId: string, sessionId: string) {
  const session = await ensureActiveSessionOwnership(sessionId, userId);
  if (!session) {
    return null;
  }
  const existing = normalizeOptionalText(session.title);
  if (existing && existing !== DEFAULT_SESSION_TITLE) {
    return session;
  }
  const messages = await prisma.chatMessage.findMany({
    where: {
      topicId: sessionId,
      role: ChatMessageRole.USER,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 6,
    select: {
      role: true,
      content: true,
    },
  });
  const title = await generateSessionTitleFromMessages(messages);
  if (!title) {
    return session;
  }
  return prisma.chatTopic.update({
    where: { id: sessionId },
    data: {
      title,
      updatedAt: new Date(),
    },
  });
}

export async function finalizeAssistantMessage(
  userId: string,
  sessionId: string,
  messageId: string,
  content: string,
  status: ChatMessageStatus,
) {
  const session = await ensureActiveSessionOwnership(sessionId, userId);
  if (!session) {
    return null;
  }
  const now = new Date();
  const message = await prisma.chatMessage.update({
    where: {
      id: messageId,
    },
    data: {
      content,
      status,
    },
  });
  await prisma.chatTopic.update({
    where: { id: sessionId },
    data: {
      lastMessageAt: now,
      updatedAt: now,
    },
  });
  return message;
}
