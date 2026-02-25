import { generateText } from '@/lib/llm';
import { logger } from '@/utils/logger';
import { buildArticlePrompt } from './articlePromptService';
import { parseArticleFromModelOutput, validateGeneratedArticle } from './articleValidationService';
import type {
  BatchGenerateOptions,
  GenerationBatchReport,
  GenerationItemResult,
} from './article-generation.types';
import {
  buildRuntimeOptions,
  createJobs,
  resolveAuthorId,
  runWithConcurrency,
  type RuntimeOptions,
} from './articleGenerationRuntime';
import { persistGeneratedArticle } from './articlePersistenceService';

interface GenerationJob {
  topic: string;
  subtopic: string;
}

async function runSingleGenerationJob(
  job: GenerationJob,
  runtime: RuntimeOptions,
  authorId: string,
): Promise<GenerationItemResult> {
  for (let retries = 0; retries <= runtime.maxRetries; retries += 1) {
    try {
      const prompt = buildArticlePrompt({
        topic: job.topic,
        subtopic: job.subtopic,
        minWords: runtime.minWords,
        maxWords: runtime.maxWords,
      });

      const output = await generateText({
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
        };
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
      };
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
        };
      }
    }
  }

  return {
    topic: job.topic,
    subtopic: job.subtopic,
    success: false,
    skipped: false,
    retryCount: runtime.maxRetries,
    error: 'Unknown generation failure',
  };
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

  const results = await runWithConcurrency(jobs, runtime.concurrency, job =>
    runSingleGenerationJob(job, runtime, authorId),
  );

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
