import { logger } from '@/utils/logger';
import { runBatchGeneration } from './articleBatchService';
import type { TopicGenerationPlan } from './article-generation.types';

function parsePlans(input: string): TopicGenerationPlan[] {
  // format: react:fiber|hooks;webpack:loader|tree-shaking
  return input
    .split(';')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [topicRaw, subtopicsRaw = ''] = item.split(':');
      const topic = topicRaw?.trim();
      const subtopics = subtopicsRaw
        .split('|')
        .map(v => v.trim())
        .filter(Boolean);
      return { topic, subtopics };
    })
    .filter(plan => plan.topic && plan.subtopics.length > 0);
}

export function startArticleGenerationScheduler(): () => void {
  const enabled = process.env.ARTICLE_CRON_ENABLED === 'true';
  if (!enabled) {
    return () => undefined;
  }

  const plansRaw = process.env.ARTICLE_CRON_PLANS ?? '';
  const plans = parsePlans(plansRaw);
  if (plans.length === 0) {
    logger.warn(
      'ARTICLE_CRON_ENABLED is true but ARTICLE_CRON_PLANS is empty/invalid; scheduler disabled',
    );
    return () => undefined;
  }

  const intervalMinutes = Math.max(1, Number(process.env.ARTICLE_CRON_INTERVAL_MINUTES ?? 1440));
  const intervalMs = intervalMinutes * 60 * 1000;
  const countPerSubtopic = Math.max(1, Number(process.env.ARTICLE_CRON_COUNT_PER_SUBTOPIC ?? 1));

  let running = false;
  const runner = async () => {
    if (running) {
      logger.warn('Article generation scheduler skipped due to previous run not finished');
      return;
    }
    running = true;
    try {
      const report = await runBatchGeneration({
        plans,
        countPerSubtopic,
        minWords: Number(process.env.ARTICLE_CRON_MIN_WORDS ?? 1200),
        maxWords: Number(process.env.ARTICLE_CRON_MAX_WORDS ?? 2500),
        concurrency: Number(process.env.ARTICLE_CRON_CONCURRENCY ?? 1),
        maxRetries: Number(process.env.ARTICLE_CRON_MAX_RETRIES ?? 2),
        autoPublish: (process.env.ARTICLE_CRON_AUTO_PUBLISH ?? 'true') === 'true',
      });

      logger.info(
        {
          batchId: report.batchId,
          requested: report.requested,
          success: report.success,
          failed: report.failed,
          skipped: report.skipped,
        },
        'Article generation scheduler run finished',
      );
    } catch (error) {
      logger.error({ err: error }, 'Article generation scheduler run failed');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void runner();
  }, intervalMs);

  logger.info(
    { intervalMinutes, countPerSubtopic, plansCount: plans.length },
    'Article generation scheduler started',
  );

  return () => {
    clearInterval(timer);
    logger.info('Article generation scheduler stopped');
  };
}
