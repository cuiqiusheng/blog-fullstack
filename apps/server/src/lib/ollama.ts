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
