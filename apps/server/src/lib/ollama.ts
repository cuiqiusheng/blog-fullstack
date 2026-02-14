import { logger } from '@/utils/logger';

export interface OllamaGenerateOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  baseUrl?: string;
}

interface OllamaGenerateResponse {
  response?: string;
  done?: boolean;
}

interface OllamaStreamResponse {
  response?: string;
  done?: boolean;
  model?: string;
  created_at?: string;
  error?: string;
}

export interface OllamaStreamChunk {
  chunk: string;
  done: boolean;
  model?: string;
  createdAt?: string;
}

export async function generateTextWithOllama(options: OllamaGenerateOptions): Promise<string> {
  const baseUrl = options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
  const model = options.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:14b';
  const timeoutMs = options.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS ?? 120000);
  const temperature = options.temperature ?? Number(process.env.OLLAMA_TEMPERATURE ?? 0.7);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: false,
        prompt: options.prompt,
        options: {
          temperature,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(
        { status: res.status, statusText: res.statusText, body, model, baseUrl },
        'Ollama request failed',
      );
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as OllamaGenerateResponse;
    if (!data.response || !data.done) {
      throw new Error('Ollama returned empty or incomplete response');
    }
    return data.response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Ollama request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function* generateTextStreamWithOllama(
  options: OllamaGenerateOptions,
): AsyncGenerator<OllamaStreamChunk> {
  const baseUrl = options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
  const model = options.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:14b';
  const timeoutMs = options.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS ?? 120000);
  const temperature = options.temperature ?? Number(process.env.OLLAMA_TEMPERATURE ?? 0.7);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const decoder = new TextDecoder();

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        prompt: options.prompt,
        options: {
          temperature,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(
        { status: res.status, statusText: res.statusText, body, model, baseUrl },
        'Ollama stream request failed',
      );
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('Ollama returned empty stream body');
    }

    const reader = res.body.getReader();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        const data = JSON.parse(trimmed) as OllamaStreamResponse;
        if (data.error) {
          throw new Error(data.error);
        }

        const chunk = data.response ?? '';
        const isDone = Boolean(data.done);
        if (!chunk && !isDone) {
          continue;
        }

        yield {
          chunk,
          done: isDone,
          model: data.model ?? model,
          createdAt: data.created_at,
        };
      }
    }

    const remaining = buffer.trim();
    if (remaining) {
      const data = JSON.parse(remaining) as OllamaStreamResponse;
      if (data.error) {
        throw new Error(data.error);
      }
      yield {
        chunk: data.response ?? '',
        done: Boolean(data.done),
        model: data.model ?? model,
        createdAt: data.created_at,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Ollama request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
