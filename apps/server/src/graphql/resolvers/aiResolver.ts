import { generateTextStreamWithOllama, generateTextWithOllama } from '@/lib/ollama';
import type { GraphQLContext } from '@/types/context';
import { requireAuth } from '@/utils/permissions';
import { ChatRole } from '../__generated__/types';
import type { AiChatStreamEvent } from '../__generated__/types';
import type { MutationAiChatArgs } from '../__generated__/types';
import type { SubscriptionAiChatStreamArgs } from '../__generated__/types';

type ChatMessages = MutationAiChatArgs['messages'] | SubscriptionAiChatStreamArgs['messages'];
type AiChatStreamPayload = { aiChatStream: AiChatStreamEvent };

function buildChatPrompt(messages: ChatMessages): string {
  const normalized = messages
    .map(message => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter(message => message.content.length > 0);

  if (normalized.length === 0) {
    throw new Error('At least one non-empty message is required');
  }

  const lines = normalized.map(message => `${message.role}: ${message.content}`);
  lines.push(`${ChatRole.Assistant}:`);
  return lines.join('\n');
}

export const aiResolvers = {
  Mutation: {
    aiChat: async (_: unknown, args: MutationAiChatArgs, context: GraphQLContext) => {
      requireAuth(context);
      const prompt = buildChatPrompt(args.messages);
      const reply = await generateTextWithOllama({
        prompt,
        model: args.model ?? undefined,
        temperature: args.temperature ?? undefined,
      });
      const model = args.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:14b';
      return {
        reply,
        model,
        createdAt: new Date().toISOString(),
      };
    },
  },
  Subscription: {
    aiChatStream: {
      subscribe: async function* (
        _: unknown,
        args: SubscriptionAiChatStreamArgs,
        context: GraphQLContext,
      ) {
        requireAuth(context);
        const prompt = buildChatPrompt(args.messages);
        const fallbackModel = args.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:14b';
        let seq = 0;
        try {
          for await (const item of generateTextStreamWithOllama({
            prompt,
            model: args.model ?? undefined,
            temperature: args.temperature ?? undefined,
          })) {
            seq += 1;
            yield {
              aiChatStream: {
                seq,
                chunk: item.chunk,
                done: item.done,
                model: item.model ?? fallbackModel,
                createdAt: item.createdAt ?? new Date().toISOString(),
                error: null,
              },
            };
          }
        } catch (error) {
          seq += 1;
          yield {
            aiChatStream: {
              seq,
              chunk: '',
              done: true,
              model: fallbackModel,
              createdAt: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown stream error',
            },
          };
        }
      },
      resolve: (payload: AiChatStreamPayload) => payload.aiChatStream,
    },
  },
};
