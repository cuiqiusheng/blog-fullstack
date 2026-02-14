/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  'mutation AiChat($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChat(messages: $messages, model: $model, temperature: $temperature) {\n    reply\n    model\n    createdAt\n  }\n}\n\nsubscription AiChatStream($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChatStream(messages: $messages, model: $model, temperature: $temperature) {\n    seq\n    chunk\n    done\n    model\n    createdAt\n    error\n  }\n}': typeof types.AiChatDocument;
  'query Me {\n  me {\n    id\n    email\n    roles {\n      id\n      name\n    }\n  }\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nmutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}': typeof types.MeDocument;
  'query Posts($topic: String, $subtopic: String, $status: PostStatus, $search: String, $sortBy: PostSortField, $sortDirection: SortDirection, $mine: Boolean, $limit: Int, $offset: Int) {\n  posts(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    sortBy: $sortBy\n    sortDirection: $sortDirection\n    mine: $mine\n    limit: $limit\n    offset: $offset\n  ) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostsTotal($topic: String, $subtopic: String, $status: PostStatus, $search: String, $mine: Boolean) {\n  postsTotal(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    mine: $mine\n  )\n}\n\nquery Post($id: ID!) {\n  post(id: $id) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostNeighbors($id: ID!) {\n  postNeighbors(id: $id) {\n    prev {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n    next {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n  }\n}': typeof types.PostsDocument;
};
const documents: Documents = {
  'mutation AiChat($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChat(messages: $messages, model: $model, temperature: $temperature) {\n    reply\n    model\n    createdAt\n  }\n}\n\nsubscription AiChatStream($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChatStream(messages: $messages, model: $model, temperature: $temperature) {\n    seq\n    chunk\n    done\n    model\n    createdAt\n    error\n  }\n}':
    types.AiChatDocument,
  'query Me {\n  me {\n    id\n    email\n    roles {\n      id\n      name\n    }\n  }\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nmutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}':
    types.MeDocument,
  'query Posts($topic: String, $subtopic: String, $status: PostStatus, $search: String, $sortBy: PostSortField, $sortDirection: SortDirection, $mine: Boolean, $limit: Int, $offset: Int) {\n  posts(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    sortBy: $sortBy\n    sortDirection: $sortDirection\n    mine: $mine\n    limit: $limit\n    offset: $offset\n  ) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostsTotal($topic: String, $subtopic: String, $status: PostStatus, $search: String, $mine: Boolean) {\n  postsTotal(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    mine: $mine\n  )\n}\n\nquery Post($id: ID!) {\n  post(id: $id) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostNeighbors($id: ID!) {\n  postNeighbors(id: $id) {\n    prev {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n    next {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n  }\n}':
    types.PostsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation AiChat($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChat(messages: $messages, model: $model, temperature: $temperature) {\n    reply\n    model\n    createdAt\n  }\n}\n\nsubscription AiChatStream($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChatStream(messages: $messages, model: $model, temperature: $temperature) {\n    seq\n    chunk\n    done\n    model\n    createdAt\n    error\n  }\n}',
): (typeof documents)['mutation AiChat($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChat(messages: $messages, model: $model, temperature: $temperature) {\n    reply\n    model\n    createdAt\n  }\n}\n\nsubscription AiChatStream($messages: [ChatMessageInput!]!, $model: String, $temperature: Float) {\n  aiChatStream(messages: $messages, model: $model, temperature: $temperature) {\n    seq\n    chunk\n    done\n    model\n    createdAt\n    error\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'query Me {\n  me {\n    id\n    email\n    roles {\n      id\n      name\n    }\n  }\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nmutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}',
): (typeof documents)['query Me {\n  me {\n    id\n    email\n    roles {\n      id\n      name\n    }\n  }\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nmutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password) {\n    token\n    user {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'query Posts($topic: String, $subtopic: String, $status: PostStatus, $search: String, $sortBy: PostSortField, $sortDirection: SortDirection, $mine: Boolean, $limit: Int, $offset: Int) {\n  posts(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    sortBy: $sortBy\n    sortDirection: $sortDirection\n    mine: $mine\n    limit: $limit\n    offset: $offset\n  ) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostsTotal($topic: String, $subtopic: String, $status: PostStatus, $search: String, $mine: Boolean) {\n  postsTotal(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    mine: $mine\n  )\n}\n\nquery Post($id: ID!) {\n  post(id: $id) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostNeighbors($id: ID!) {\n  postNeighbors(id: $id) {\n    prev {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n    next {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n  }\n}',
): (typeof documents)['query Posts($topic: String, $subtopic: String, $status: PostStatus, $search: String, $sortBy: PostSortField, $sortDirection: SortDirection, $mine: Boolean, $limit: Int, $offset: Int) {\n  posts(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    sortBy: $sortBy\n    sortDirection: $sortDirection\n    mine: $mine\n    limit: $limit\n    offset: $offset\n  ) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostsTotal($topic: String, $subtopic: String, $status: PostStatus, $search: String, $mine: Boolean) {\n  postsTotal(\n    topic: $topic\n    subtopic: $subtopic\n    status: $status\n    search: $search\n    mine: $mine\n  )\n}\n\nquery Post($id: ID!) {\n  post(id: $id) {\n    id\n    title\n    content\n    topic\n    subtopic\n    seriesKey\n    seriesOrder\n    status\n    publishedAt\n    source\n    wordCount\n    generationBatchId\n    createdAt\n    updatedAt\n    author {\n      id\n      email\n      roles {\n        id\n        name\n      }\n    }\n  }\n}\n\nquery PostNeighbors($id: ID!) {\n  postNeighbors(id: $id) {\n    prev {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n    next {\n      id\n      title\n      seriesKey\n      seriesOrder\n    }\n  }\n}'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
