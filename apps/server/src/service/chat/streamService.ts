import { ChatMessageRole, ChatMessageStatus } from '@/generated/prisma/client';
import { generateTextStream } from '@/lib/llm';
import { prisma } from '@/lib/prisma';
import { finalizeAssistantMessage, maybeGenerateSessionTitle } from './commandService';
import { ChatSessionStreamEvent, ChatStreamEventType } from '@/graphql/__generated__/types';

function buildPromptFromMessages(
  messages: Array<{ role: ChatMessageRole; content: string; status: ChatMessageStatus }>,
) {
  const normalized = messages
    .filter(message => message.content.trim().length > 0)
    .map(message => `${message.role}: ${message.content.trim()}`);
  normalized.push('ASSISTANT:');
  return normalized.join('\n');
}

export async function* streamSessionAssistantReply(options: {
  userId: string;
  sessionId: string;
  messageId: string;
}): AsyncGenerator<ChatSessionStreamEvent> {
  const session = await prisma.chatTopic.findFirst({
    where: {
      id: options.sessionId,
      userId: options.userId,
    },
  });
  if (!session) {
    throw new Error('Chat session not found');
  }
  const assistant = await prisma.chatMessage.findFirst({
    where: {
      id: options.messageId,
      topicId: options.sessionId,
      role: ChatMessageRole.ASSISTANT,
      status: ChatMessageStatus.STREAMING,
    },
  });
  if (!assistant) {
    throw new Error('Streaming assistant message not found');
  }

  const history = await prisma.chatMessage.findMany({
    where: {
      topicId: options.sessionId,
      OR: [{ status: ChatMessageStatus.COMPLETED }, { id: options.messageId }],
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      role: true,
      content: true,
      status: true,
    },
  });
  const prompt = buildPromptFromMessages(history);

  let seq = 0;
  let accumulated = '';
  const base = {
    sessionId: options.sessionId,
    messageId: options.messageId,
  };

  seq += 1;
  yield {
    ...base,
    eventId: `${options.messageId}:${seq}`,
    seq,
    type: ChatStreamEventType.MessageStarted,
    chunk: '',
    done: false,
    createdAt: new Date().toISOString(),
    error: null,
  };

  try {
    for await (const item of generateTextStream({ prompt })) {
      if (item.chunk) {
        accumulated += item.chunk;
      }
      seq += 1;
      yield {
        ...base,
        eventId: `${options.messageId}:${seq}`,
        seq,
        type: ChatStreamEventType.MessageChunk,
        chunk: item.chunk,
        done: false,
        createdAt: item.createdAt ?? new Date().toISOString(),
        model: item.model ?? undefined,
        error: null,
      };
    }

    await finalizeAssistantMessage(
      options.userId,
      options.sessionId,
      options.messageId,
      accumulated,
      ChatMessageStatus.COMPLETED,
    );
    await maybeGenerateSessionTitle(options.userId, options.sessionId);
    seq += 1;
    yield {
      ...base,
      eventId: `${options.messageId}:${seq}`,
      seq,
      type: ChatStreamEventType.MessageCompleted,
      chunk: '',
      done: true,
      createdAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    await finalizeAssistantMessage(
      options.userId,
      options.sessionId,
      options.messageId,
      accumulated,
      ChatMessageStatus.FAILED,
    );
    seq += 1;
    yield {
      ...base,
      eventId: `${options.messageId}:${seq}`,
      seq,
      type: ChatStreamEventType.MessageFailed,
      chunk: '',
      done: true,
      createdAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown stream error',
    };
  }
}
