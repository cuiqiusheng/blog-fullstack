import type { Resolvers } from '../__generated__/types';
import { authResolvers } from './authResolver';
import { aiResolvers } from './aiResolver';
import { postResolvers } from './postResolver';

export const resolvers: Resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    ...authResolvers.Query,
    ...postResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...aiResolvers.Mutation,
    ...postResolvers.Mutation,
  },
  Subscription: {
    ...aiResolvers.Subscription,
  },
};
