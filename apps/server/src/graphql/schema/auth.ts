export const authTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    roles: [Role!]!
  }

  type Role {
    id: ID!
    name: String!
    description: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!): AuthPayload!
  }
`;
