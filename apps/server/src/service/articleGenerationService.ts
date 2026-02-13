import { randomUUID } from 'crypto';
import { PostStatus } from '@/generated/prisma/client';
import { generateTextWithOllama } from '@/lib/ollama';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { buildArticlePrompt } from './articlePromptService';
import { parseArticleFromModelOutput, validateGeneratedArticle } from './articleValidationService';

export interface TopicGenerationPlan {
  topic: string;
  subtopics: string[];
}

export interface BatchGenerateOptions {
  plans: TopicGenerationPlan[];
  countPerSubtopic?: number;
  minWords?: number;
  maxWords?: number;
  concurrency?: number;
  autoPublish?: boolean;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  authorId?: string;
  source?: string;
  batchId?: string;
  throttlePerTopicPerDay?: number;
}

export interface GenerationItemResult {
  topic: string;
  subtopic: string;
  success: boolean;
  skipped: boolean;
  retryCount: number;
  title?: string;
  postId?: string;
  wordCount?: number;
  error?: string;
}

export interface GenerationBatchReport {
  batchId: string;
  requested: number;
  success: number;
  failed: number;
  skipped: number;
  startedAt: string;
  finishedAt: string;
  results: GenerationItemResult[];
}

export interface ListPostsOptions {
  topic?: string;
  subtopic?: string;
  status?: PostStatus;
  limit?: number;
  offset?: number;
}

interface Job {
  topic: string;
  subtopic: string;
}

interface RuntimeOptions {
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

function buildRuntimeOptions(options: BatchGenerateOptions): RuntimeOptions {
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

function createJobs(plans: TopicGenerationPlan[], countPerSubtopic: number): Job[] {
  const jobs: Job[] = [];
  for (const plan of plans) {
    for (const subtopic of plan.subtopics) {
      for (let i = 0; i < countPerSubtopic; i += 1) {
        jobs.push({ topic: plan.topic.trim(), subtopic: subtopic.trim() });
      }
    }
  }
  return jobs.filter(job => job.topic && job.subtopic);
}

async function resolveAuthorId(explicitAuthorId?: string): Promise<string> {
  if (explicitAuthorId) {
    const user = await prisma.user.findUnique({ where: { id: explicitAuthorId } });
    if (!user) {
      throw new Error(`authorId not found: ${explicitAuthorId}`);
    }
    return user.id;
  }

  const authorEmail = process.env.ARTICLE_AUTHOR_EMAIL;
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

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
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

async function persistGeneratedArticle(params: {
  topic: string;
  subtopic: string;
  title: string;
  content: string;
  wordCount: number;
  contentHash: string;
  runtime: RuntimeOptions;
  authorId: string;
  prompt: string;
}): Promise<{ kind: 'success'; postId: string } | { kind: 'skip'; reason: string }> {
  const now = new Date();
  if (params.runtime.throttlePerTopicPerDay > 0) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.post.count({
      where: {
        topic: params.topic,
        createdAt: { gte: dayStart },
      },
    });
    if (todayCount >= params.runtime.throttlePerTopicPerDay) {
      return {
        kind: 'skip',
        reason: `throttled topic=${params.topic} dailyLimit=${params.runtime.throttlePerTopicPerDay}`,
      };
    }
  }

  const duplicateByHash = await prisma.post.findFirst({
    where: { contentHash: params.contentHash },
    select: { id: true },
  });
  if (duplicateByHash) {
    return { kind: 'skip', reason: 'duplicate content hash' };
  }

  const duplicateByTitle = await prisma.post.findFirst({
    where: {
      title: params.title,
      topic: params.topic,
      subtopic: params.subtopic,
    },
    select: { id: true },
  });
  if (duplicateByTitle) {
    return { kind: 'skip', reason: 'duplicate title in same topic/subtopic' };
  }

  try {
    const post = await prisma.post.create({
      data: {
        title: params.title,
        content: params.content,
        topic: params.topic,
        subtopic: params.subtopic,
        status: params.runtime.autoPublish ? PostStatus.PUBLISHED : PostStatus.DRAFT,
        publishedAt: params.runtime.autoPublish ? now : null,
        source: params.runtime.source,
        wordCount: params.wordCount,
        generationBatchId: params.runtime.batchId,
        generationPrompt: params.prompt,
        contentHash: params.contentHash,
        authorId: params.authorId,
      },
      select: { id: true },
    });

    return { kind: 'success', postId: post.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('posts_contentHash_key')) {
      return { kind: 'skip', reason: 'duplicate content hash (race)' };
    }
    throw error;
  }
}

export async function runBatchGeneration(
  options: BatchGenerateOptions,
): Promise<GenerationBatchReport> {
  const runtime = buildRuntimeOptions(options);
  const jobs = createJobs(options.plans, runtime.countPerSubtopic);
  const startedAt = new Date();

  if (jobs.length === 0) {
    throw new Error('No generation jobs created. Check topic/subtopic input.');
  }

  const authorId = await resolveAuthorId(options.authorId);
  logger.info(
    {
      batchId: runtime.batchId,
      requested: jobs.length,
      model: runtime.model,
      concurrency: runtime.concurrency,
      minWords: runtime.minWords,
      maxWords: runtime.maxWords,
    },
    'Article generation batch started',
  );

  const results = await runWithConcurrency(jobs, runtime.concurrency, async job => {
    let retries = 0;
    while (retries <= runtime.maxRetries) {
      try {
        const prompt = buildArticlePrompt({
          topic: job.topic,
          subtopic: job.subtopic,
          minWords: runtime.minWords,
          maxWords: runtime.maxWords,
        });

        const output = await generateTextWithOllama({
          model: runtime.model,
          prompt,
          temperature: runtime.temperature,
        });

        const parsed = parseArticleFromModelOutput(output);
        const validated = validateGeneratedArticle(parsed, {
          minWords: runtime.minWords,
          maxWords: runtime.maxWords,
        });

        const persisted = await persistGeneratedArticle({
          topic: job.topic,
          subtopic: job.subtopic,
          title: validated.title,
          content: validated.content,
          wordCount: validated.wordCount,
          contentHash: validated.contentHash,
          runtime,
          authorId,
          prompt,
        });

        if (persisted.kind === 'skip') {
          return {
            topic: job.topic,
            subtopic: job.subtopic,
            success: false,
            skipped: true,
            retryCount: retries,
            title: validated.title,
            wordCount: validated.wordCount,
            error: persisted.reason,
          } satisfies GenerationItemResult;
        }

        return {
          topic: job.topic,
          subtopic: job.subtopic,
          success: true,
          skipped: false,
          retryCount: retries,
          title: validated.title,
          postId: persisted.postId,
          wordCount: validated.wordCount,
        } satisfies GenerationItemResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (retries >= runtime.maxRetries) {
          return {
            topic: job.topic,
            subtopic: job.subtopic,
            success: false,
            skipped: false,
            retryCount: retries,
            error: message,
          } satisfies GenerationItemResult;
        }
        retries += 1;
      }
    }

    return {
      topic: job.topic,
      subtopic: job.subtopic,
      success: false,
      skipped: false,
      retryCount: runtime.maxRetries,
      error: 'Unknown generation failure',
    } satisfies GenerationItemResult;
  });

  const finishedAt = new Date();
  const success = results.filter(item => item.success).length;
  const skipped = results.filter(item => item.skipped).length;
  const failed = results.length - success - skipped;

  const report: GenerationBatchReport = {
    batchId: runtime.batchId,
    requested: jobs.length,
    success,
    failed,
    skipped,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    results,
  };

  logger.info(
    {
      batchId: report.batchId,
      requested: report.requested,
      success: report.success,
      failed: report.failed,
      skipped: report.skipped,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    },
    'Article generation batch finished',
  );

  return report;
}

export async function listPosts(options: ListPostsOptions = {}) {
  return prisma.post.findMany({
    where: {
      topic: options.topic,
      subtopic: options.subtopic,
      status: options.status,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          roles: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 20,
    skip: options.offset ?? 0,
  });
}

export async function getGenerationBatchReport(batchId: string): Promise<GenerationBatchReport> {
  const posts = await prisma.post.findMany({
    where: { generationBatchId: batchId },
    orderBy: { createdAt: 'asc' },
  });

  if (posts.length === 0) {
    return {
      batchId,
      requested: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      startedAt: new Date(0).toISOString(),
      finishedAt: new Date(0).toISOString(),
      results: [],
    };
  }

  const results: GenerationItemResult[] = posts.map(post => ({
    topic: post.topic ?? '',
    subtopic: post.subtopic ?? '',
    success: true,
    skipped: false,
    retryCount: 0,
    title: post.title,
    postId: post.id,
    wordCount: post.wordCount ?? undefined,
  }));

  return {
    batchId,
    requested: posts.length,
    success: posts.length,
    failed: 0,
    skipped: 0,
    startedAt: posts[0].createdAt.toISOString(),
    finishedAt: posts[posts.length - 1].createdAt.toISOString(),
    results,
  };
}

export async function retryGenerationBatch(
  batchId: string,
  countPerSubtopic = 1,
): Promise<GenerationBatchReport> {
  const posts = await prisma.post.findMany({
    where: { generationBatchId: batchId },
    select: { topic: true, subtopic: true },
  });
  if (posts.length === 0) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  const planMap = new Map<string, Set<string>>();
  for (const post of posts) {
    if (!post.topic || !post.subtopic) {
      continue;
    }
    if (!planMap.has(post.topic)) {
      planMap.set(post.topic, new Set());
    }
    planMap.get(post.topic)!.add(post.subtopic);
  }

  const plans: TopicGenerationPlan[] = Array.from(planMap.entries()).map(([topic, subtopics]) => ({
    topic,
    subtopics: Array.from(subtopics),
  }));

  return runBatchGeneration({
    plans,
    countPerSubtopic,
  });
}
