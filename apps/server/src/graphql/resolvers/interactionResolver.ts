import type { GraphQLContext } from '../../types/context';
import { requireAuth } from '../../utils/permissions';
import { toGqlPost } from './postMapper';
import {
  toggleLike,
  toggleBookmark,
  getPostInteractionInfo,
  getComments,
  getCommentsTotal,
  createComment,
  deleteComment,
  getMyBookmarks,
  getMyBookmarksTotal,
  getUserInteractionStats,
} from '../../service/interaction';
import type {
  MutationToggleLikeArgs,
  MutationToggleBookmarkArgs,
  MutationCreateCommentArgs,
  MutationDeleteCommentArgs,
  QueryCommentsArgs,
  QueryCommentsTotalArgs,
  QueryMyBookmarksArgs,
} from '../__generated__/types';

export const interactionResolvers = {
  Query: {
    comments: async (_: unknown, args: QueryCommentsArgs) => {
      return getComments(args.postId, args.limit ?? 20, args.offset ?? 0);
    },
    commentsTotal: async (_: unknown, args: QueryCommentsTotalArgs) => {
      return getCommentsTotal(args.postId);
    },
    myBookmarks: async (_: unknown, args: QueryMyBookmarksArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      const posts = await getMyBookmarks(user.id, args.limit ?? 20, args.offset ?? 0);
      return posts.map(toGqlPost);
    },
    myBookmarksTotal: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return getMyBookmarksTotal(user.id);
    },
    myInteractionStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return getUserInteractionStats(user.id);
    },
  },
  Mutation: {
    toggleLike: async (_: unknown, args: MutationToggleLikeArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return toggleLike(user.id, args.postId);
    },
    toggleBookmark: async (
      _: unknown,
      args: MutationToggleBookmarkArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      return toggleBookmark(user.id, args.postId);
    },
    createComment: async (_: unknown, args: MutationCreateCommentArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return createComment(user.id, args.postId, args.content);
    },
    deleteComment: async (_: unknown, args: MutationDeleteCommentArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return deleteComment(args.id, user.id);
    },
  },
  Post: {
    interactionInfo: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      const userId = context.user?.id ?? null;
      return getPostInteractionInfo(parent.id, userId);
    },
  },
};
