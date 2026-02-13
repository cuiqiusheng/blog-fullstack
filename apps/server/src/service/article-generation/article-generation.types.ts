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
