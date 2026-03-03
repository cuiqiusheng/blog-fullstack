import {
  generateTextWithOllama,
  generateTextStreamWithOllama,
  type OllamaGenerateOptions,
} from './ollama';
import {
  generateText as openaiGenerateText,
  generateTextStream as openaiGenerateTextStream,
  chatCompletionStream as openaiChatCompletionStream,
} from './openaiCompatible';

export type {
  ChatMessage,
  ToolCall,
  ToolDefinition,
  ChatCompletionStreamOptions,
} from './openaiCompatible';

export interface LlmGenerateOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface LlmStreamChunk {
  chunk: string;
  done: boolean;
  model?: string;
  createdAt?: string;
}

export type { StreamChunk } from './openaiCompatible';

type Provider = 'ollama' | 'openai-compatible' | 'none';

function resolveProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (explicit === 'ollama') return 'ollama';
  if (explicit === 'openai-compatible') return 'openai-compatible';

  if (process.env.LLM_API_KEY && process.env.LLM_API_BASE_URL) return 'openai-compatible';
  if (process.env.OLLAMA_BASE_URL) return 'ollama';

  return 'none';
}

export function getActiveModel(): string {
  const provider = resolveProvider();
  switch (provider) {
    case 'openai-compatible':
      return process.env.LLM_MODEL ?? 'gpt-3.5-turbo';
    case 'ollama':
      return process.env.OLLAMA_MODEL ?? 'qwen2.5:14b';
    default:
      return '';
  }
}

export async function generateText(options: LlmGenerateOptions): Promise<string> {
  const provider = resolveProvider();

  switch (provider) {
    case 'ollama':
      return generateTextWithOllama(options as OllamaGenerateOptions);

    case 'openai-compatible':
      return openaiGenerateText(options);

    default:
      throw new Error(
        'No LLM provider configured. Set LLM_PROVIDER and related environment variables.',
      );
  }
}

export async function* generateTextStream(
  options: LlmGenerateOptions,
): AsyncGenerator<LlmStreamChunk> {
  const provider = resolveProvider();

  switch (provider) {
    case 'ollama':
      for await (const chunk of generateTextStreamWithOllama(options as OllamaGenerateOptions)) {
        yield chunk as LlmStreamChunk;
      }
      return;

    case 'openai-compatible':
      for await (const chunk of openaiGenerateTextStream(options)) {
        yield chunk;
      }
      return;

    default:
      throw new Error(
        'No LLM provider configured. Set LLM_PROVIDER and related environment variables.',
      );
  }
}

export { openaiChatCompletionStream as chatCompletionStream };
