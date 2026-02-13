import 'dotenv/config';
import { logger } from '@/utils/logger';
import { runBatchGeneration, type TopicGenerationPlan } from '@/service/articleGenerationService';

interface ParsedArgs {
  plans: TopicGenerationPlan[];
  countPerSubtopic: number;
  minWords: number;
  maxWords: number;
  concurrency: number;
  maxRetries: number;
  autoPublish: boolean;
  model?: string;
  temperature?: number;
  authorId?: string;
  batchId?: string;
}

function readArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) {
    return undefined;
  }
  return args[idx + 1];
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }
  return value === 'true' || value === '1' || value === 'yes';
}

function parsePlans(
  topicRaw: string | undefined,
  subtopicsRaw: string | undefined,
): TopicGenerationPlan[] {
  const fallbackPlans: TopicGenerationPlan[] = [
    { topic: 'react', subtopics: ['fiber', 'hooks'] },
    { topic: 'webpack', subtopics: ['tree-shaking', 'module-federation'] },
  ];

  if (!topicRaw && !subtopicsRaw) {
    return fallbackPlans;
  }

  const topics = (topicRaw ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  if (!subtopicsRaw) {
    if (topics.length === 0) {
      return fallbackPlans;
    }
    return topics.map(topic => ({ topic, subtopics: ['overview'] }));
  }

  // Mapping mode: react:fiber|hooks;webpack:loader|tree-shaking
  if (subtopicsRaw.includes(':')) {
    return subtopicsRaw
      .split(';')
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const [topicPart, subPart = ''] = item.split(':');
        return {
          topic: topicPart.trim(),
          subtopics: subPart
            .split('|')
            .map(v => v.trim())
            .filter(Boolean),
        };
      })
      .filter(plan => plan.topic && plan.subtopics.length > 0);
  }

  const subtopics = subtopicsRaw
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  if (topics.length === 0) {
    return [{ topic: 'general', subtopics }];
  }
  return topics.map(topic => ({ topic, subtopics }));
}

function parseArgs(argv: string[]): ParsedArgs {
  const topicRaw = readArg(argv, '--topic');
  const subtopicsRaw = readArg(argv, '--subtopics');

  const plans = parsePlans(topicRaw, subtopicsRaw);
  if (plans.length === 0) {
    throw new Error('No valid generation plans parsed from --topic/--subtopics');
  }

  const countPerSubtopic = Math.max(1, Number(readArg(argv, '--count') ?? 1));
  const minWords = Math.max(200, Number(readArg(argv, '--minWords') ?? 1200));
  const maxWords = Math.max(minWords, Number(readArg(argv, '--maxWords') ?? 2500));
  const concurrency = Math.max(1, Number(readArg(argv, '--concurrency') ?? 1));
  const maxRetries = Math.max(0, Number(readArg(argv, '--maxRetries') ?? 2));

  return {
    plans,
    countPerSubtopic,
    minWords,
    maxWords,
    concurrency,
    maxRetries,
    autoPublish: parseBoolean(readArg(argv, '--autoPublish'), true),
    model: readArg(argv, '--model'),
    temperature: readArg(argv, '--temperature')
      ? Number(readArg(argv, '--temperature'))
      : undefined,
    authorId: readArg(argv, '--authorId'),
    batchId: readArg(argv, '--batchId'),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  logger.info({ args }, 'Starting batch article generation CLI');

  const report = await runBatchGeneration(args);
  logger.info(
    {
      batchId: report.batchId,
      requested: report.requested,
      success: report.success,
      failed: report.failed,
      skipped: report.skipped,
      startedAt: report.startedAt,
      finishedAt: report.finishedAt,
    },
    'Batch article generation completed',
  );

  if (report.failed > 0) {
    report.results
      .filter(item => !item.success && !item.skipped)
      .slice(0, 20)
      .forEach(item => {
        logger.error({ item }, 'Generation item failed');
      });
  }
}

main().catch(error => {
  logger.fatal({ err: error }, 'Batch article generation failed');
  process.exit(1);
});
