import { prisma } from '@/lib/prisma';
import type {
  GenerationBatchReport,
  GenerationItemResult,
  TopicGenerationPlan,
} from './article-generation.types';
import { runBatchGeneration } from './articleBatchService';

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
