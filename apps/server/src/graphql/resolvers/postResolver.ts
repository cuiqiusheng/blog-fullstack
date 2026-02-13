import { PostStatus as PrismaPostStatus } from '@/generated/prisma/client';
import {
  getGenerationBatchReport,
  listPosts,
  retryGenerationBatch,
  runBatchGeneration,
  type TopicGenerationPlan,
} from '@/service/articleGenerationService';
import { PostStatus as GqlPostStatus } from '../__generated__/types';
import type {
  GeneratePostsInput,
  MutationGeneratePostsArgs,
  MutationRetryGenerationBatchArgs,
  QueryGenerationBatchArgs,
  QueryPostsArgs,
} from '../__generated__/types';
import type { GraphQLContext } from '@/types/context';
import { requireAuth } from '@/utils/permissions';

function normalizePlans(plans: GeneratePostsInput['plans']): TopicGenerationPlan[] {
  return plans.map(plan => ({
    topic: plan.topic,
    subtopics: plan.subtopics,
  }));
}

const gqlToPrismaStatus: Record<GqlPostStatus, PrismaPostStatus> = {
  [GqlPostStatus.Draft]: PrismaPostStatus.DRAFT,
  [GqlPostStatus.Published]: PrismaPostStatus.PUBLISHED,
  [GqlPostStatus.Archived]: PrismaPostStatus.ARCHIVED,
};

const prismaToGqlStatus: Record<PrismaPostStatus, GqlPostStatus> = {
  [PrismaPostStatus.DRAFT]: GqlPostStatus.Draft,
  [PrismaPostStatus.PUBLISHED]: GqlPostStatus.Published,
  [PrismaPostStatus.ARCHIVED]: GqlPostStatus.Archived,
};

export const postResolvers = {
  Query: {
    posts: async (_: unknown, args: QueryPostsArgs, context: GraphQLContext) => {
      requireAuth(context);
      const rows = await listPosts({
        topic: args.topic ?? undefined,
        subtopic: args.subtopic ?? undefined,
        status: args.status ? gqlToPrismaStatus[args.status] : undefined,
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });
      return rows.map(post => ({
        ...post,
        status: prismaToGqlStatus[post.status],
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      }));
    },
    generationBatch: async (
      _: unknown,
      args: QueryGenerationBatchArgs,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return getGenerationBatchReport(args.batchId);
    },
  },
  Mutation: {
    generatePosts: async (_: unknown, args: MutationGeneratePostsArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return runBatchGeneration({
        plans: normalizePlans(args.input.plans),
        countPerSubtopic: args.input.countPerSubtopic ?? undefined,
        minWords: args.input.minWords ?? undefined,
        maxWords: args.input.maxWords ?? undefined,
        concurrency: args.input.concurrency ?? undefined,
        maxRetries: args.input.maxRetries ?? undefined,
        temperature: args.input.temperature ?? undefined,
        autoPublish: args.input.autoPublish ?? undefined,
        authorId: user.id,
      });
    },
    retryGenerationBatch: async (
      _: unknown,
      args: MutationRetryGenerationBatchArgs,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return retryGenerationBatch(args.batchId, args.countPerSubtopic ?? 1);
    },
  },
};
