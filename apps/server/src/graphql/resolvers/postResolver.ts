import { PostStatus as PrismaPostStatus } from '@/generated/prisma/client';
import {
  runBatchGeneration,
  getGenerationBatchReport,
  retryGenerationBatch,
  countPosts,
  getPostById,
  getPostNeighbors,
  listPosts,
  type TopicGenerationPlan,
} from '@/service';
import {
  PostStatus as GqlPostStatus,
  PostSortField as GqlPostSortField,
  SortDirection as GqlSortDirection,
} from '../__generated__/types';
import type {
  GeneratePostsInput,
  MutationGeneratePostsArgs,
  MutationRetryGenerationBatchArgs,
  QueryPostArgs,
  QueryGenerationBatchArgs,
  QueryPostNeighborsArgs,
  QueryPostsArgs,
  QueryPostsTotalArgs,
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

const gqlToServiceSortField: Record<GqlPostSortField, 'createdAt' | 'updatedAt' | 'subtopic'> = {
  [GqlPostSortField.CreatedAt]: 'createdAt',
  [GqlPostSortField.UpdatedAt]: 'updatedAt',
  [GqlPostSortField.Subtopic]: 'subtopic',
};

const gqlToServiceSortDirection: Record<GqlSortDirection, 'asc' | 'desc'> = {
  [GqlSortDirection.Asc]: 'asc',
  [GqlSortDirection.Desc]: 'desc',
};

export const postResolvers = {
  Query: {
    post: async (_: unknown, args: QueryPostArgs, context: GraphQLContext) => {
      requireAuth(context);
      const row = await getPostById(args.id);
      if (!row) {
        return null;
      }
      return {
        ...row,
        status: prismaToGqlStatus[row.status],
        seriesKey: row.seriesKey,
        seriesOrder: row.seriesOrder,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      };
    },
    postNeighbors: async (_: unknown, args: QueryPostNeighborsArgs, context: GraphQLContext) => {
      requireAuth(context);
      const neighbors = await getPostNeighbors(args.id);
      const mapPost = (post: NonNullable<typeof neighbors.prev>) => ({
        ...post,
        status: prismaToGqlStatus[post.status],
        seriesKey: post.seriesKey,
        seriesOrder: post.seriesOrder,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      });
      return {
        prev: neighbors.prev ? mapPost(neighbors.prev) : null,
        next: neighbors.next ? mapPost(neighbors.next) : null,
      };
    },
    posts: async (_: unknown, args: QueryPostsArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      const rows = await listPosts({
        topic: args.topic ?? undefined,
        subtopic: args.subtopic ?? undefined,
        status: args.status ? gqlToPrismaStatus[args.status] : undefined,
        search: args.search ?? undefined,
        sortBy: args.sortBy ? gqlToServiceSortField[args.sortBy] : undefined,
        sortDirection: args.sortDirection
          ? gqlToServiceSortDirection[args.sortDirection]
          : undefined,
        mine: args.mine ?? undefined,
        authorId: args.mine ? user.id : undefined,
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });
      return rows.map(post => ({
        ...post,
        status: prismaToGqlStatus[post.status],
        seriesKey: post.seriesKey,
        seriesOrder: post.seriesOrder,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      }));
    },
    postsTotal: async (_: unknown, args: QueryPostsTotalArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return countPosts({
        topic: args.topic ?? undefined,
        subtopic: args.subtopic ?? undefined,
        status: args.status ? gqlToPrismaStatus[args.status] : undefined,
        search: args.search ?? undefined,
        mine: args.mine ?? undefined,
        authorId: args.mine ? user.id : undefined,
      });
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
