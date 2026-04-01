import { prisma } from '@/lib/prisma';
import { PostStatus, PostVisibility } from '@/generated/prisma/client';
import { toggleFollow, getFollowing, getFollowers, getUserProfile } from '@/service';
import type {
  MutationToggleFollowArgs,
  QueryUserProfileArgs,
  QueryMyFollowingArgs,
  QueryMyFollowersArgs,
} from '../__generated__/types';
import type { GraphQLContext } from '@/types/context';
import { requireAuth } from '@/utils/permissions';

export const followResolvers = {
  Query: {
    userProfile: async (_: unknown, args: QueryUserProfileArgs) => {
      return getUserProfile(args.id);
    },
    myFollowing: async (_: unknown, args: QueryMyFollowingArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return getFollowing(user.id, args.limit ?? 20, args.offset ?? 0);
    },
    myFollowers: async (_: unknown, args: QueryMyFollowersArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return getFollowers(user.id, args.limit ?? 20, args.offset ?? 0);
    },
  },
  Mutation: {
    toggleFollow: async (_: unknown, args: MutationToggleFollowArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return toggleFollow(user.id, args.userId);
    },
  },
  User: {
    followerCount: async (parent: { id: string }) => {
      return prisma.userFollow.count({ where: { followingId: parent.id } });
    },
    followingCount: async (parent: { id: string }) => {
      return prisma.userFollow.count({ where: { followerId: parent.id } });
    },
    isFollowing: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      if (!context.user || context.user.id === parent.id) return null;
      const row = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: context.user.id,
            followingId: parent.id,
          },
        },
      });
      return Boolean(row);
    },
    postCount: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      if (context.user?.id === parent.id) {
        return prisma.post.count({
          where: { authorId: parent.id },
        });
      }

      return prisma.post.count({
        where: {
          authorId: parent.id,
          status: PostStatus.PUBLISHED,
          visibility: PostVisibility.PUBLIC,
        },
      });
    },
  },
};
