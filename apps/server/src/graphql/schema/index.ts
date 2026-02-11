import { authTypeDefs } from './auth';

const rootTypeDefs = `#graphql
  type Query {
    hello: String
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [rootTypeDefs, authTypeDefs];
export { authTypeDefs } from './auth';
