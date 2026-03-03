import { logger } from '@/utils/logger';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ConnectionConfig {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface OpenAICompatibleOptions extends ConnectionConfig {
  prompt: string;
}

export interface ToolCallFunction {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: ToolCallFunction;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface StreamChunk {
  chunk: string;
  done: boolean;
  model?: string;
  createdAt?: string;
  toolCalls?: ToolCall[];
  finishReason?: string;
}

export interface ChatCompletionStreamOptions extends ConnectionConfig {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
}

// ---------------------------------------------------------------------------
// Internal response types
// ---------------------------------------------------------------------------

interface ToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface ChatCompletionChoice {
  message?: { content?: string | null; tool_calls?: ToolCall[] };
  delta?: { content?: string | null; tool_calls?: ToolCallDelta[] };
  finish_reason?: string | null;
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
  model?: string;
  created?: number;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

function resolveConfig(options: ConnectionConfig) {
  const apiKey = options.apiKey ?? process.env.LLM_API_KEY;
  const baseUrl = (options.baseUrl ?? process.env.LLM_API_BASE_URL ?? '').replace(/\/+$/, '');
  const model = options.model ?? process.env.LLM_MODEL ?? 'gpt-3.5-turbo';
  const temperature = options.temperature ?? 0.7;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!apiKey) {
    throw new Error('LLM_API_KEY is required for openai-compatible provider');
  }
  if (!baseUrl) {
    throw new Error('LLM_API_BASE_URL is required for openai-compatible provider');
  }

  return { apiKey, baseUrl, model, temperature, timeoutMs };
}

function makeHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

// ---------------------------------------------------------------------------
// Simple prompt-based API (backward compatible)
// ---------------------------------------------------------------------------

export async function generateText(options: OpenAICompatibleOptions): Promise<string> {
  const { apiKey, baseUrl, model, temperature, timeoutMs } = resolveConfig(options);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: makeHeaders(apiKey),
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: options.prompt }],
        temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(
        { status: res.status, statusText: res.statusText, body, model, baseUrl },
        'OpenAI-compatible request failed',
      );
      throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty response');
    }
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`LLM request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function* generateTextStream(
  options: OpenAICompatibleOptions,
): AsyncGenerator<StreamChunk> {
  const { apiKey, baseUrl, model, temperature, timeoutMs } = resolveConfig(options);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const decoder = new TextDecoder();

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: makeHeaders(apiKey),
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'user', content: options.prompt }],
        temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(
        { status: res.status, statusText: res.statusText, body, model, baseUrl },
        'OpenAI-compatible stream request failed',
      );
      throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('LLM returned empty stream body');
    }

    const reader = res.body.getReader();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          yield { chunk: '', done: true, model };
          return;
        }

        const data = JSON.parse(payload) as ChatCompletionResponse;
        const delta = data.choices?.[0]?.delta?.content ?? '';
        const finishReason = data.choices?.[0]?.finish_reason;

        if (!delta && !finishReason) continue;

        yield {
          chunk: delta,
          done: finishReason != null,
          model: data.model ?? model,
          createdAt: data.created ? new Date(data.created * 1000).toISOString() : undefined,
        };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`LLM request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Messages-based streaming with Function Calling support
// ---------------------------------------------------------------------------

/**
 * Accumulates tool_call deltas that arrive as fragments across multiple SSE
 * chunks. Each delta carries an `index` that identifies the tool call slot,
 * while `id`, `function.name`, and `function.arguments` are delivered
 * incrementally.
 */
function mergeToolCallDelta(
  accumulated: Map<number, { id: string; name: string; arguments: string }>,
  deltas: ToolCallDelta[],
) {
  for (const d of deltas) {
    const existing = accumulated.get(d.index);
    if (existing) {
      if (d.function?.arguments) {
        existing.arguments += d.function.arguments;
      }
    } else {
      accumulated.set(d.index, {
        id: d.id ?? '',
        name: d.function?.name ?? '',
        arguments: d.function?.arguments ?? '',
      });
    }
  }
}

function buildToolCalls(
  accumulated: Map<number, { id: string; name: string; arguments: string }>,
): ToolCall[] {
  return Array.from(accumulated.values()).map(tc => ({
    id: tc.id,
    type: 'function' as const,
    function: { name: tc.name, arguments: tc.arguments },
  }));
}

export async function* chatCompletionStream(
  options: ChatCompletionStreamOptions,
): AsyncGenerator<StreamChunk> {
  const { apiKey, baseUrl, model, temperature, timeoutMs } = resolveConfig(options);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const decoder = new TextDecoder();

  const body: Record<string, unknown> = {
    model,
    stream: true,
    messages: options.messages,
    temperature,
  };
  if (options.tools?.length) {
    body.tools = options.tools;
  }

  logger.debug(
    {
      model,
      messageCount: options.messages.length,
      lastMessageRole: options.messages[options.messages.length - 1]?.role,
      tools: options.tools?.map(t => t.function.name),
    },
    'LLM chat completion request',
  );

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: makeHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error(
        { status: res.status, statusText: res.statusText, body: text, model, baseUrl },
        'OpenAI-compatible chat stream request failed',
      );
      throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('LLM returned empty stream body');
    }

    const reader = res.body.getReader();
    let sseBuffer = '';
    const toolCallAccumulator = new Map<number, { id: string; name: string; arguments: string }>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          const toolCalls =
            toolCallAccumulator.size > 0 ? buildToolCalls(toolCallAccumulator) : undefined;
          yield { chunk: '', done: true, model, toolCalls, finishReason: 'stop' };
          return;
        }

        const data = JSON.parse(payload) as ChatCompletionResponse;
        const choice = data.choices?.[0];
        if (!choice) continue;

        const deltaToolCalls = choice.delta?.tool_calls;
        if (deltaToolCalls) {
          mergeToolCallDelta(toolCallAccumulator, deltaToolCalls);
        }

        const contentDelta = choice.delta?.content ?? '';
        const finishReason = choice.finish_reason;

        if (finishReason === 'tool_calls') {
          const toolCalls = buildToolCalls(toolCallAccumulator);
          yield { chunk: '', done: true, model: data.model ?? model, toolCalls, finishReason };
          return;
        }

        if (!contentDelta && !finishReason) continue;

        yield {
          chunk: contentDelta,
          done: finishReason != null,
          model: data.model ?? model,
          createdAt: data.created ? new Date(data.created * 1000).toISOString() : undefined,
          finishReason: finishReason ?? undefined,
        };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`LLM request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
