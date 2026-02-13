import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { BatchGenerateOptions, TopicGenerationPlan } from './article-generation.types';
import { normalizeOptionalText, normalizeRequiredText } from '../shared/textNormalization';

interface Job {
  topic: string;
  subtopic: string;
}

export interface RuntimeOptions {
  countPerSubtopic: number;
  minWords: number;
  maxWords: number;
  concurrency: number;
  autoPublish: boolean;
  model: string;
  temperature: number;
  maxRetries: number;
  source: string;
  batchId: string;
  throttlePerTopicPerDay: number;
}

export function buildRuntimeOptions(options: BatchGenerateOptions): RuntimeOptions {
  const model = options.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:14b';
  return {
    countPerSubtopic: options.countPerSubtopic ?? 1,
    minWords: options.minWords ?? 1200,
    maxWords: options.maxWords ?? 2500,
    concurrency: Math.max(1, options.concurrency ?? 1),
    autoPublish: options.autoPublish ?? true,
    model,
    temperature: options.temperature ?? Number(process.env.OLLAMA_TEMPERATURE ?? 0.7),
    maxRetries: Math.max(0, options.maxRetries ?? 2),
    source: options.source ?? `ollama:${model}`,
    batchId: options.batchId ?? randomUUID(),
    throttlePerTopicPerDay: Math.max(
      0,
      options.throttlePerTopicPerDay ??
        Number(process.env.ARTICLE_THROTTLE_PER_TOPIC_PER_DAY ?? 20),
    ),
  };
}

export function createJobs(plans: TopicGenerationPlan[], countPerSubtopic: number): Job[] {
  const jobs: Job[] = [];
  for (const plan of plans) {
    const topic = normalizeRequiredText(plan.topic);
    for (const subtopicRaw of plan.subtopics) {
      const subtopic = normalizeOptionalText(subtopicRaw);
      if (!topic || !subtopic) {
        continue;
      }
      for (let i = 0; i < countPerSubtopic; i += 1) {
        jobs.push({ topic, subtopic });
      }
    }
  }
  return jobs;
}

export async function resolveAuthorId(explicitAuthorId?: string): Promise<string> {
  if (explicitAuthorId) {
    const user = await prisma.user.findUnique({ where: { id: explicitAuthorId } });
    if (!user) {
      throw new Error(`authorId not found: ${explicitAuthorId}`);
    }
    return user.id;
  }

  const authorEmail = normalizeOptionalText(process.env.ARTICLE_AUTHOR_EMAIL);
  if (authorEmail) {
    const user = await prisma.user.findUnique({ where: { email: authorEmail } });
    if (!user) {
      throw new Error(`ARTICLE_AUTHOR_EMAIL not found in DB: ${authorEmail}`);
    }
    return user.id;
  }

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!fallbackUser) {
    throw new Error('No user found to author generated posts');
  }
  return fallbackUser.id;
}

export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (_item: T, _index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: safeConcurrency }, async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= items.length) {
          break;
        }
        results[index] = await worker(items[index], index);
      }
    }),
  );

  return results;
}
