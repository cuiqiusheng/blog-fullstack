import { PostStatus, PostVisibility } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { parseSeriesMetaFromSubtopic } from '../series/seriesMeta';
import type { RuntimeOptions } from './articleGenerationRuntime';
import { normalizeRequiredText } from '../shared/textNormalization';

export interface PersistGeneratedArticleParams {
  topic: string;
  subtopic: string;
  title: string;
  content: string;
  wordCount: number;
  contentHash: string;
  runtime: RuntimeOptions;
  authorId: string;
  prompt: string;
}

export type PersistGeneratedArticleResult =
  | { kind: 'success'; postId: string }
  | { kind: 'skip'; reason: string };

export async function persistGeneratedArticle(
  params: PersistGeneratedArticleParams,
): Promise<PersistGeneratedArticleResult> {
  const topic = normalizeRequiredText(params.topic);
  const subtopic = normalizeRequiredText(params.subtopic);
  const title = normalizeRequiredText(params.title);
  const now = new Date();

  const seriesMeta = parseSeriesMetaFromSubtopic(subtopic);
  if (params.runtime.throttlePerTopicPerDay > 0) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.post.count({
      where: {
        topic,
        createdAt: { gte: dayStart },
      },
    });
    if (todayCount >= params.runtime.throttlePerTopicPerDay) {
      return {
        kind: 'skip',
        reason: `throttled topic=${topic} dailyLimit=${params.runtime.throttlePerTopicPerDay}`,
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
      title,
      topic,
      subtopic,
    },
    select: { id: true },
  });
  if (duplicateByTitle) {
    return { kind: 'skip', reason: 'duplicate title in same topic/subtopic' };
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content: params.content,
        topic,
        subtopic,
        seriesKey: seriesMeta?.seriesKey ?? null,
        seriesOrder: seriesMeta?.seriesOrder ?? null,
        status: params.runtime.autoPublish ? PostStatus.PUBLISHED : PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
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
