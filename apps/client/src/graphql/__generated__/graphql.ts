import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type GeneratePostsInput = {
  autoPublish?: InputMaybe<Scalars['Boolean']['input']>;
  concurrency?: InputMaybe<Scalars['Int']['input']>;
  countPerSubtopic?: InputMaybe<Scalars['Int']['input']>;
  maxRetries?: InputMaybe<Scalars['Int']['input']>;
  maxWords?: InputMaybe<Scalars['Int']['input']>;
  minWords?: InputMaybe<Scalars['Int']['input']>;
  plans: Array<GenerationPlanInput>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
};

export type GenerationBatchReport = {
  __typename?: 'GenerationBatchReport';
  batchId: Scalars['String']['output'];
  failed: Scalars['Int']['output'];
  finishedAt: Scalars['String']['output'];
  requested: Scalars['Int']['output'];
  results: Array<GenerationItemResult>;
  skipped: Scalars['Int']['output'];
  startedAt: Scalars['String']['output'];
  success: Scalars['Int']['output'];
};

export type GenerationItemResult = {
  __typename?: 'GenerationItemResult';
  error?: Maybe<Scalars['String']['output']>;
  postId?: Maybe<Scalars['ID']['output']>;
  retryCount: Scalars['Int']['output'];
  skipped: Scalars['Boolean']['output'];
  subtopic: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  title?: Maybe<Scalars['String']['output']>;
  topic: Scalars['String']['output'];
  wordCount?: Maybe<Scalars['Int']['output']>;
};

export type GenerationPlanInput = {
  subtopics: Array<Scalars['String']['input']>;
  topic: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  generatePosts: GenerationBatchReport;
  login: AuthPayload;
  register: AuthPayload;
  retryGenerationBatch: GenerationBatchReport;
};

export type MutationGeneratePostsArgs = {
  input: GeneratePostsInput;
};

export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationRetryGenerationBatchArgs = {
  batchId: Scalars['String']['input'];
  countPerSubtopic?: InputMaybe<Scalars['Int']['input']>;
};

export type Post = {
  __typename?: 'Post';
  author: User;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  generationBatchId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  publishedAt?: Maybe<Scalars['String']['output']>;
  seriesKey?: Maybe<Scalars['String']['output']>;
  seriesOrder?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  status: PostStatus;
  subtopic?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  topic?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
  wordCount?: Maybe<Scalars['Int']['output']>;
};

export type PostNeighbors = {
  __typename?: 'PostNeighbors';
  next?: Maybe<Post>;
  prev?: Maybe<Post>;
};

export enum PostSortField {
  CreatedAt = 'CREATED_AT',
  Subtopic = 'SUBTOPIC',
  UpdatedAt = 'UPDATED_AT',
}

export enum PostStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
}

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  generationBatch: GenerationBatchReport;
  hello?: Maybe<Scalars['String']['output']>;
  me?: Maybe<User>;
  post?: Maybe<Post>;
  postNeighbors: PostNeighbors;
  posts: Array<Post>;
  postsTotal: Scalars['Int']['output'];
};

export type QueryGenerationBatchArgs = {
  batchId: Scalars['String']['input'];
};

export type QueryPostArgs = {
  id: Scalars['ID']['input'];
};

export type QueryPostNeighborsArgs = {
  id: Scalars['ID']['input'];
};

export type QueryPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<PostSortField>;
  sortDirection?: InputMaybe<SortDirection>;
  status?: InputMaybe<PostStatus>;
  subtopic?: InputMaybe<Scalars['String']['input']>;
  topic?: InputMaybe<Scalars['String']['input']>;
};

export type QueryPostsTotalArgs = {
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  subtopic?: InputMaybe<Scalars['String']['input']>;
  topic?: InputMaybe<Scalars['String']['input']>;
};

export type Role = {
  __typename?: 'Role';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  roles: Array<Role>;
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me?: {
    __typename?: 'User';
    id: string;
    email: string;
    roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
  } | null;
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type LoginMutation = {
  __typename?: 'Mutation';
  login: {
    __typename?: 'AuthPayload';
    token: string;
    user: {
      __typename?: 'User';
      id: string;
      email: string;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
  };
};

export type RegisterMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: {
    __typename?: 'AuthPayload';
    token: string;
    user: {
      __typename?: 'User';
      id: string;
      email: string;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
  };
};

export type PostsQueryVariables = Exact<{
  topic?: InputMaybe<Scalars['String']['input']>;
  subtopic?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<PostSortField>;
  sortDirection?: InputMaybe<SortDirection>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type PostsQuery = {
  __typename?: 'Query';
  posts: Array<{
    __typename?: 'Post';
    id: string;
    title: string;
    content: string;
    topic?: string | null;
    subtopic?: string | null;
    seriesKey?: string | null;
    seriesOrder?: number | null;
    status: PostStatus;
    publishedAt?: string | null;
    source?: string | null;
    wordCount?: number | null;
    generationBatchId?: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
      __typename?: 'User';
      id: string;
      email: string;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
  }>;
};

export type PostsTotalQueryVariables = Exact<{
  topic?: InputMaybe<Scalars['String']['input']>;
  subtopic?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  search?: InputMaybe<Scalars['String']['input']>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type PostsTotalQuery = { __typename?: 'Query'; postsTotal: number };

export type PostQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type PostQuery = {
  __typename?: 'Query';
  post?: {
    __typename?: 'Post';
    id: string;
    title: string;
    content: string;
    topic?: string | null;
    subtopic?: string | null;
    seriesKey?: string | null;
    seriesOrder?: number | null;
    status: PostStatus;
    publishedAt?: string | null;
    source?: string | null;
    wordCount?: number | null;
    generationBatchId?: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
      __typename?: 'User';
      id: string;
      email: string;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
  } | null;
};

export type PostNeighborsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type PostNeighborsQuery = {
  __typename?: 'Query';
  postNeighbors: {
    __typename?: 'PostNeighbors';
    prev?: {
      __typename?: 'Post';
      id: string;
      title: string;
      seriesKey?: string | null;
      seriesOrder?: number | null;
    } | null;
    next?: {
      __typename?: 'Post';
      id: string;
      title: string;
      seriesKey?: string | null;
      seriesOrder?: number | null;
    } | null;
  };
};

export const MeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Me' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'roles' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const LoginDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Login' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'login' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'email' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'password' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'token' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'roles' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Register' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'register' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'email' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'password' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'token' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'roles' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const PostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Posts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'topic' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subtopic' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostStatus' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sortBy' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostSortField' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sortDirection' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'SortDirection' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mine' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'posts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'topic' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'topic' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subtopic' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subtopic' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'status' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sortBy' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sortBy' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sortDirection' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sortDirection' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mine' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mine' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                { kind: 'Field', name: { kind: 'Name', value: 'subtopic' } },
                { kind: 'Field', name: { kind: 'Name', value: 'seriesKey' } },
                { kind: 'Field', name: { kind: 'Name', value: 'seriesOrder' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'publishedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generationBatchId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'roles' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PostsQuery, PostsQueryVariables>;
export const PostsTotalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PostsTotal' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'topic' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subtopic' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostStatus' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mine' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'postsTotal' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'topic' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'topic' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subtopic' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subtopic' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'status' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mine' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mine' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PostsTotalQuery, PostsTotalQueryVariables>;
export const PostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Post' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                { kind: 'Field', name: { kind: 'Name', value: 'subtopic' } },
                { kind: 'Field', name: { kind: 'Name', value: 'seriesKey' } },
                { kind: 'Field', name: { kind: 'Name', value: 'seriesOrder' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'publishedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generationBatchId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'roles' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PostQuery, PostQueryVariables>;
export const PostNeighborsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PostNeighbors' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'postNeighbors' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'prev' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'seriesKey' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'seriesOrder' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'next' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'seriesKey' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'seriesOrder' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PostNeighborsQuery, PostNeighborsQueryVariables>;
