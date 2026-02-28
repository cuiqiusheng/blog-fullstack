import type { GraphQLContext } from '../../types/context';
import { requireAuth } from '../../utils/permissions';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  notificationTopic,
  pubsub,
} from '../../service/notification';
import type {
  Notification,
  QueryNotificationsArgs,
  MutationMarkNotificationReadArgs,
} from '../__generated__/types';

export const notificationResolvers = {
  Query: {
    notifications: async (_: unknown, args: QueryNotificationsArgs, context: GraphQLContext) => {
      const user = requireAuth(context);
      return getNotifications(user.id, args.limit ?? 20, args.offset ?? 0);
    },
    unreadNotificationCount: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return getUnreadCount(user.id);
    },
  },
  Mutation: {
    markNotificationRead: async (
      _: unknown,
      args: MutationMarkNotificationReadArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context);
      return markRead(args.id, user.id);
    },
    markAllNotificationsRead: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return markAllRead(user.id);
    },
  },
  Subscription: {
    notificationReceived: {
      subscribe: (_: unknown, __: unknown, context: GraphQLContext) => {
        const user = requireAuth(context);
        return pubsub.asyncIterableIterator(notificationTopic(user.id));
      },
      resolve: (payload: { notificationReceived: Notification }) => payload.notificationReceived,
    },
  },
};
