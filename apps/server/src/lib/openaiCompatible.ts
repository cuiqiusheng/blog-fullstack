import { logger } from '@/utils/logger';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export interface OpenAICompatibleOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  apiKey?: string;
  baseUrl?: string;
}

interface ChatCompletionChoice {
  message?: { content?: string };
  delta?: { content?: string };
  finish_reason?: string | null;
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
  model?: string;
  created?: number;
}

export interface StreamChunk {
  chunk: string;
  done: boolean;
  model?: string;
  createdAt?: string;
}

function resolveConfig(options: OpenAICompatibleOptions) {
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

export async function generateText(options: OpenAICompatibleOptions): Promise<string> {
  const { apiKey, baseUrl, model, temperature, timeoutMs } = resolveConfig(options);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
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
