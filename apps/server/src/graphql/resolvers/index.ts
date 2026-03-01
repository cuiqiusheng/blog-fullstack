import type { Resolvers } from '../__generated__/types';
import { authResolvers } from './authResolver';
import { aiResolvers } from './aiResolver';
import { chatResolvers } from './chatResolver';
import { postResolvers } from './postResolver';
import { interactionResolvers } from './interactionResolver';
import { notificationResolvers } from './notificationResolver';
import { followResolvers } from './followResolver';

export const resolvers: Resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    ...authResolvers.Query,
    ...chatResolvers.Query,
    ...postResolvers.Query,
    ...interactionResolvers.Query,
    ...notificationResolvers.Query,
    ...followResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...aiResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...postResolvers.Mutation,
    ...interactionResolvers.Mutation,
    ...notificationResolvers.Mutation,
    ...followResolvers.Mutation,
  },
  Post: {
    ...interactionResolvers.Post,
  },
  User: {
    ...followResolvers.User,
  },
  ChatSession: {
    ...chatResolvers.ChatSession,
  },
  Subscription: {
    ...aiResolvers.Subscription,
    ...chatResolvers.Subscription,
    ...notificationResolvers.Subscription,
  },
};
