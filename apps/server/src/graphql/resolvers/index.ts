import type { Resolvers } from '../__generated__/types';
import { authResolvers } from './authResolver';
import { aiResolvers } from './aiResolver';
import { chatResolvers } from './chatResolver';
import { postResolvers } from './postResolver';

export const resolvers: Resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    ...authResolvers.Query,
    ...chatResolvers.Query,
    ...postResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...aiResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...postResolvers.Mutation,
  },
  ChatSession: {
    ...chatResolvers.ChatSession,
  },
  Subscription: {
    ...aiResolvers.Subscription,
    ...chatResolvers.Subscription,
  },
};
