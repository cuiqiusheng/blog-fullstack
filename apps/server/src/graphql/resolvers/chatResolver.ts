import {
  ChatMessageRole,
  ChatMessageStatus as PrismaChatMessageStatus,
  ChatSessionStatus as PrismaChatSessionStatus,
} from '@/generated/prisma/client';
import {
  archiveChatSession,
  countChatSessions,
  deleteChatSession,
  getChatSessionById,
  listChatSessionMessages,
  listChatSessions,
  renameChatSession,
  sendChatMessageCommand,
  startChatSession,
  streamSessionAssistantReply,
} from '@/service';
import type { GraphQLContext } from '@/types/context';
import { requireAuth } from '@/utils/permissions';
import {
  ChatRole,
  ChatMessageStatus as GqlChatMessageStatus,
  ChatSessionStatus as GqlChatSessionStatus,
  ChatStreamEventType as GqlChatStreamEventType,
} from '../__generated__/types';
import type {
  ChatSessionStreamEvent,
  MutationArchiveChatSessionArgs,
  MutationDeleteChatSessionArgs,
  MutationRenameChatSessionArgs,
  MutationSendChatMessageArgs,
  MutationStartChatSessionArgs,
  QueryChatSessionArgs,
  QueryChatSessionsArgs,
  SubscriptionChatSessionStreamArgs,
} from '../__generated__/types';

const prismaToGqlRole: Record<ChatMessageRole, ChatRole> = {
  [ChatMessageRole.SYSTEM]: ChatRole.System,
  [ChatMessageRole.USER]: ChatRole.User,
  [ChatMessageRole.ASSISTANT]: ChatRole.Assistant,
};

const prismaToGqlMessageStatus: Record<PrismaChatMessageStatus, GqlChatMessageStatus> = {
  [PrismaChatMessageStatus.STREAMING]: GqlChatMessageStatus.Streaming,
  [PrismaChatMessageStatus.COMPLETED]: GqlChatMessageStatus.Completed,
  [PrismaChatMessageStatus.FAILED]: GqlChatMessageStatus.Failed,
};

const prismaToGqlSessionStatus: Record<PrismaChatSessionStatus, GqlChatSessionStatus> = {
  [PrismaChatSessionStatus.ACTIVE]: GqlChatSessionStatus.Active,
  [PrismaChatSessionStatus.ARCHIVED]: GqlChatSessionStatus.Archived,
};

const streamTypeToGql: Record<string, GqlChatStreamEventType> = {
  MESSAGE_STARTED: GqlChatStreamEventType.MessageStarted,
  MESSAGE_CHUNK: GqlChatStreamEventType.MessageChunk,
  MESSAGE_COMPLETED: GqlChatStreamEventType.MessageCompleted,
  MESSAGE_FAILED: GqlChatStreamEventType.MessageFailed,
};

function toChatMessage(row: {
  id: string;
  role: ChatMessageRole;
  status?: PrismaChatMessageStatus;
  content: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    role: prismaToGqlRole[row.role],
    status: prismaToGqlMessageStatus[row.status ?? PrismaChatMessageStatus.COMPLETED],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

function toChatSession(row: {
  id: string;
  title: string;
  status: PrismaChatSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
}) {
  return {
    id: row.id,
    title: row.title,
    status: prismaToGqlSessionStatus[row.status],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    messages: [],
  };
}

export const chatResolvers = {
  Query: {
    chatSessions: async (_: unknown, args: QueryChatSessionsArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      const rows = await listChatSessions({
        userId: user.id,
        limit: args.limit ?? undefined,
        offset: args.offset ?? undefined,
        search: args.search ?? undefined,
      });
      return rows.map(toChatSession);
    },
    chatSession: async (_: unknown, args: QueryChatSessionArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      const row = await getChatSessionById(args.id, user.id);
      if (!row) {
        return null;
      }
      return toChatSession(row);
    },
    chatSessionsTotal: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return countChatSessions(user.id);
    },
  },
  Mutation: {
    startChatSession: async (
      _: unknown,
      args: MutationStartChatSessionArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      const row = await startChatSession(user.id, args.input?.title ?? undefined);
      return toChatSession(row);
    },
    sendChatMessage: async (
      _: unknown,
      args: MutationSendChatMessageArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      const result = await sendChatMessageCommand(user.id, args.sessionId, args.content);
      if (!result) {
        throw new Error('Chat session not found');
      }
      return {
        session: toChatSession(result.session),
        userMessage: toChatMessage(result.userMessage),
        assistantMessage: toChatMessage(result.assistantMessage),
      };
    },
    renameChatSession: async (
      _: unknown,
      args: MutationRenameChatSessionArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      const row = await renameChatSession(user.id, args.sessionId, args.title);
      if (!row) {
        throw new Error('Chat session not found');
      }
      return toChatSession(row);
    },
    archiveChatSession: async (
      _: unknown,
      args: MutationArchiveChatSessionArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      const row = await archiveChatSession(user.id, args.sessionId);
      if (!row) {
        throw new Error('Chat session not found');
      }
      return toChatSession(row);
    },
    deleteChatSession: async (
      _: unknown,
      args: MutationDeleteChatSessionArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      return deleteChatSession(user.id, args.sessionId);
    },
  },
  ChatSession: {
    messages: async (
      parent: { id: string },
      args: { limit?: number | null; offset?: number | null },
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      const rows = await listChatSessionMessages(
        parent.id,
        user.id,
        args.limit ?? undefined,
        args.offset ?? undefined,
      );
      if (!rows) {
        return [];
      }
      return rows.map(toChatMessage);
    },
  },
  Subscription: {
    chatSessionStream: {
      subscribe: async function* (
        _: unknown,
        args: SubscriptionChatSessionStreamArgs,
        context: GraphQLContext,
      ) {
        const user = requireAuth(context);
        for await (const event of streamSessionAssistantReply({
          userId: user.id,
          sessionId: args.sessionId,
          messageId: args.messageId,
        })) {
          yield {
            chatSessionStream: {
              ...event,
              type: streamTypeToGql[event.type],
            },
          };
        }
      },
      resolve: (payload: { chatSessionStream: ChatSessionStreamEvent }) =>
        payload.chatSessionStream,
    },
  },
};
