import {
  runBatchGeneration,
  getGenerationBatchReport,
  retryGenerationBatch,
  countPosts,
  getPostById,
  getPostNeighbors,
  listPosts,
  createPost,
  updatePost,
  deletePost,
  type TopicGenerationPlan,
} from '@/service';
import {
  PostSortField as GqlPostSortField,
  SortDirection as GqlSortDirection,
  type GeneratePostsInput,
  type MutationCreatePostArgs,
  type MutationDeletePostArgs,
  type MutationGeneratePostsArgs,
  type MutationRetryGenerationBatchArgs,
  type MutationUpdatePostArgs,
  type QueryPostArgs,
  type QueryGenerationBatchArgs,
  type QueryPostNeighborsArgs,
  type QueryPostsArgs,
  type QueryPostsTotalArgs,
} from '../__generated__/types';
import type { GraphQLContext } from '@/types/context';
import { requireAuth } from '@/utils/permissions';
import { gqlToPrismaStatus, toGqlPost } from './postMapper';

function createExcerpt(content: string, maxLength = 200): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function normalizePlans(plans: GeneratePostsInput['plans']): TopicGenerationPlan[] {
  return plans.map(plan => ({
    topic: plan.topic,
    subtopics: plan.subtopics,
  }));
}

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
      return toGqlPost(row);
    },
    postNeighbors: async (_: unknown, args: QueryPostNeighborsArgs, context: GraphQLContext) => {
      requireAuth(context);
      return getPostNeighbors(args.id);
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
        authorId: args.authorId ?? (args.mine ? user.id : undefined),
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });
      return rows.map(toGqlPost);
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
    createPost: async (_: unknown, args: MutationCreatePostArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      const post = await createPost(user.id, args.input);
      return toGqlPost(post);
    },
    updatePost: async (_: unknown, args: MutationUpdatePostArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      const post = await updatePost(args.id, user.id, args.input);
      return toGqlPost(post);
    },
    deletePost: async (_: unknown, args: MutationDeletePostArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return deletePost(args.id, user.id);
    },
  },
  Post: {
    excerpt: (parent: { content: string }) => createExcerpt(parent.content, 200),
  },
};
