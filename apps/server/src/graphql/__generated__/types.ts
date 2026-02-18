import { GraphQLResolveInfo } from 'graphql';
import { GraphQLContext } from '../../types/context';
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
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type AiChatStreamEvent = {
  __typename?: 'AiChatStreamEvent';
  chunk: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  done: Scalars['Boolean']['output'];
  error?: Maybe<Scalars['String']['output']>;
  model: Scalars['String']['output'];
  seq: Scalars['Int']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type ChatMessage = {
  __typename?: 'ChatMessage';
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  role: ChatRole;
  status: ChatMessageStatus;
};

export type ChatMessageInput = {
  content: Scalars['String']['input'];
  role: ChatRole;
};

export enum ChatMessageStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Streaming = 'STREAMING',
}

export type ChatResponse = {
  __typename?: 'ChatResponse';
  createdAt: Scalars['String']['output'];
  model: Scalars['String']['output'];
  reply: Scalars['String']['output'];
};

export enum ChatRole {
  Assistant = 'ASSISTANT',
  System = 'SYSTEM',
  User = 'USER',
}

export type ChatSession = {
  __typename?: 'ChatSession';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastMessageAt?: Maybe<Scalars['String']['output']>;
  messages: Array<ChatMessage>;
  status: ChatSessionStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type ChatSessionMessagesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export enum ChatSessionStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
}

export type ChatSessionStreamEvent = {
  __typename?: 'ChatSessionStreamEvent';
  chunk: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  done: Scalars['Boolean']['output'];
  error?: Maybe<Scalars['String']['output']>;
  eventId: Scalars['String']['output'];
  messageId: Scalars['ID']['output'];
  seq: Scalars['Int']['output'];
  sessionId: Scalars['ID']['output'];
  type: ChatStreamEventType;
};

export enum ChatStreamEventType {
  MessageChunk = 'MESSAGE_CHUNK',
  MessageCompleted = 'MESSAGE_COMPLETED',
  MessageFailed = 'MESSAGE_FAILED',
  MessageStarted = 'MESSAGE_STARTED',
}

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
  aiChat: ChatResponse;
  archiveChatSession: ChatSession;
  deleteChatSession: Scalars['Boolean']['output'];
  generatePosts: GenerationBatchReport;
  login: AuthPayload;
  register: AuthPayload;
  renameChatSession: ChatSession;
  retryGenerationBatch: GenerationBatchReport;
  sendChatMessage: SendChatMessagePayload;
  startChatSession: ChatSession;
};

export type MutationAiChatArgs = {
  messages: Array<ChatMessageInput>;
  model?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
};

export type MutationArchiveChatSessionArgs = {
  sessionId: Scalars['ID']['input'];
};

export type MutationDeleteChatSessionArgs = {
  sessionId: Scalars['ID']['input'];
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

export type MutationRenameChatSessionArgs = {
  sessionId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type MutationRetryGenerationBatchArgs = {
  batchId: Scalars['String']['input'];
  countPerSubtopic?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationSendChatMessageArgs = {
  content: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};

export type MutationStartChatSessionArgs = {
  input?: InputMaybe<StartChatSessionInput>;
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
  chatSession?: Maybe<ChatSession>;
  chatSessions: Array<ChatSession>;
  generationBatch: GenerationBatchReport;
  hello?: Maybe<Scalars['String']['output']>;
  me?: Maybe<User>;
  post?: Maybe<Post>;
  postNeighbors: PostNeighbors;
  posts: Array<Post>;
  postsTotal: Scalars['Int']['output'];
};

export type QueryChatSessionArgs = {
  id: Scalars['ID']['input'];
};

export type QueryChatSessionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
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

export type SendChatMessagePayload = {
  __typename?: 'SendChatMessagePayload';
  assistantMessage: ChatMessage;
  session: ChatSession;
  userMessage: ChatMessage;
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type StartChatSessionInput = {
  title?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']['output']>;
  aiChatStream: AiChatStreamEvent;
  chatSessionStream: ChatSessionStreamEvent;
};

export type SubscriptionAiChatStreamArgs = {
  messages: Array<ChatMessageInput>;
  model?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
};

export type SubscriptionChatSessionStreamArgs = {
  messageId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  roles: Array<Role>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AiChatStreamEvent: ResolverTypeWrapper<AiChatStreamEvent>;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ChatMessage: ResolverTypeWrapper<ChatMessage>;
  ChatMessageInput: ChatMessageInput;
  ChatMessageStatus: ChatMessageStatus;
  ChatResponse: ResolverTypeWrapper<ChatResponse>;
  ChatRole: ChatRole;
  ChatSession: ResolverTypeWrapper<ChatSession>;
  ChatSessionStatus: ChatSessionStatus;
  ChatSessionStreamEvent: ResolverTypeWrapper<ChatSessionStreamEvent>;
  ChatStreamEventType: ChatStreamEventType;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GeneratePostsInput: GeneratePostsInput;
  GenerationBatchReport: ResolverTypeWrapper<GenerationBatchReport>;
  GenerationItemResult: ResolverTypeWrapper<GenerationItemResult>;
  GenerationPlanInput: GenerationPlanInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Post: ResolverTypeWrapper<Post>;
  PostNeighbors: ResolverTypeWrapper<PostNeighbors>;
  PostSortField: PostSortField;
  PostStatus: PostStatus;
  Query: ResolverTypeWrapper<{}>;
  Role: ResolverTypeWrapper<Role>;
  SendChatMessagePayload: ResolverTypeWrapper<SendChatMessagePayload>;
  SortDirection: SortDirection;
  StartChatSessionInput: StartChatSessionInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  User: ResolverTypeWrapper<User>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AiChatStreamEvent: AiChatStreamEvent;
  AuthPayload: AuthPayload;
  Boolean: Scalars['Boolean']['output'];
  ChatMessage: ChatMessage;
  ChatMessageInput: ChatMessageInput;
  ChatResponse: ChatResponse;
  ChatSession: ChatSession;
  ChatSessionStreamEvent: ChatSessionStreamEvent;
  Float: Scalars['Float']['output'];
  GeneratePostsInput: GeneratePostsInput;
  GenerationBatchReport: GenerationBatchReport;
  GenerationItemResult: GenerationItemResult;
  GenerationPlanInput: GenerationPlanInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  Post: Post;
  PostNeighbors: PostNeighbors;
  Query: {};
  Role: Role;
  SendChatMessagePayload: SendChatMessagePayload;
  StartChatSessionInput: StartChatSessionInput;
  String: Scalars['String']['output'];
  Subscription: {};
  User: User;
}>;

export type AiChatStreamEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['AiChatStreamEvent'] =
    ResolversParentTypes['AiChatStreamEvent'],
> = ResolversObject<{
  chunk?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  model?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  seq?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AuthPayloadResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload'],
> = ResolversObject<{
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChatMessageResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['ChatMessage'] = ResolversParentTypes['ChatMessage'],
> = ResolversObject<{
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['ChatRole'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ChatMessageStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChatResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['ChatResponse'] = ResolversParentTypes['ChatResponse'],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reply?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChatSessionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['ChatSession'] = ResolversParentTypes['ChatSession'],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastMessageAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  messages?: Resolver<
    Array<ResolversTypes['ChatMessage']>,
    ParentType,
    ContextType,
    Partial<ChatSessionMessagesArgs>
  >;
  status?: Resolver<ResolversTypes['ChatSessionStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChatSessionStreamEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['ChatSessionStreamEvent'] =
    ResolversParentTypes['ChatSessionStreamEvent'],
> = ResolversObject<{
  chunk?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  messageId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  seq?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ChatStreamEventType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GenerationBatchReportResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['GenerationBatchReport'] =
    ResolversParentTypes['GenerationBatchReport'],
> = ResolversObject<{
  batchId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  finishedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requested?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  results?: Resolver<Array<ResolversTypes['GenerationItemResult']>, ParentType, ContextType>;
  skipped?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GenerationItemResultResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['GenerationItemResult'] =
    ResolversParentTypes['GenerationItemResult'],
> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  retryCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  skipped?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  subtopic?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topic?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  wordCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  aiChat?: Resolver<
    ResolversTypes['ChatResponse'],
    ParentType,
    ContextType,
    RequireFields<MutationAiChatArgs, 'messages'>
  >;
  archiveChatSession?: Resolver<
    ResolversTypes['ChatSession'],
    ParentType,
    ContextType,
    RequireFields<MutationArchiveChatSessionArgs, 'sessionId'>
  >;
  deleteChatSession?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteChatSessionArgs, 'sessionId'>
  >;
  generatePosts?: Resolver<
    ResolversTypes['GenerationBatchReport'],
    ParentType,
    ContextType,
    RequireFields<MutationGeneratePostsArgs, 'input'>
  >;
  login?: Resolver<
    ResolversTypes['AuthPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationLoginArgs, 'email' | 'password'>
  >;
  register?: Resolver<
    ResolversTypes['AuthPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationRegisterArgs, 'email' | 'password'>
  >;
  renameChatSession?: Resolver<
    ResolversTypes['ChatSession'],
    ParentType,
    ContextType,
    RequireFields<MutationRenameChatSessionArgs, 'sessionId' | 'title'>
  >;
  retryGenerationBatch?: Resolver<
    ResolversTypes['GenerationBatchReport'],
    ParentType,
    ContextType,
    RequireFields<MutationRetryGenerationBatchArgs, 'batchId'>
  >;
  sendChatMessage?: Resolver<
    ResolversTypes['SendChatMessagePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationSendChatMessageArgs, 'content' | 'sessionId'>
  >;
  startChatSession?: Resolver<
    ResolversTypes['ChatSession'],
    ParentType,
    ContextType,
    Partial<MutationStartChatSessionArgs>
  >;
}>;

export type PostResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post'],
> = ResolversObject<{
  author?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generationBatchId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  publishedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  seriesKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  seriesOrder?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  source?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['PostStatus'], ParentType, ContextType>;
  subtopic?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  topic?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  wordCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PostNeighborsResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['PostNeighbors'] = ResolversParentTypes['PostNeighbors'],
> = ResolversObject<{
  next?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType>;
  prev?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  chatSession?: Resolver<
    Maybe<ResolversTypes['ChatSession']>,
    ParentType,
    ContextType,
    RequireFields<QueryChatSessionArgs, 'id'>
  >;
  chatSessions?: Resolver<
    Array<ResolversTypes['ChatSession']>,
    ParentType,
    ContextType,
    Partial<QueryChatSessionsArgs>
  >;
  generationBatch?: Resolver<
    ResolversTypes['GenerationBatchReport'],
    ParentType,
    ContextType,
    RequireFields<QueryGenerationBatchArgs, 'batchId'>
  >;
  hello?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  post?: Resolver<
    Maybe<ResolversTypes['Post']>,
    ParentType,
    ContextType,
    RequireFields<QueryPostArgs, 'id'>
  >;
  postNeighbors?: Resolver<
    ResolversTypes['PostNeighbors'],
    ParentType,
    ContextType,
    RequireFields<QueryPostNeighborsArgs, 'id'>
  >;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType, Partial<QueryPostsArgs>>;
  postsTotal?: Resolver<
    ResolversTypes['Int'],
    ParentType,
    ContextType,
    Partial<QueryPostsTotalArgs>
  >;
}>;

export type RoleResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role'],
> = ResolversObject<{
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SendChatMessagePayloadResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['SendChatMessagePayload'] =
    ResolversParentTypes['SendChatMessagePayload'],
> = ResolversObject<{
  assistantMessage?: Resolver<ResolversTypes['ChatMessage'], ParentType, ContextType>;
  session?: Resolver<ResolversTypes['ChatSession'], ParentType, ContextType>;
  userMessage?: Resolver<ResolversTypes['ChatMessage'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription'],
> = ResolversObject<{
  _empty?: SubscriptionResolver<Maybe<ResolversTypes['String']>, '_empty', ParentType, ContextType>;
  aiChatStream?: SubscriptionResolver<
    ResolversTypes['AiChatStreamEvent'],
    'aiChatStream',
    ParentType,
    ContextType,
    RequireFields<SubscriptionAiChatStreamArgs, 'messages'>
  >;
  chatSessionStream?: SubscriptionResolver<
    ResolversTypes['ChatSessionStreamEvent'],
    'chatSessionStream',
    ParentType,
    ContextType,
    RequireFields<SubscriptionChatSessionStreamArgs, 'messageId' | 'sessionId'>
  >;
}>;

export type UserResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User'],
> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  AiChatStreamEvent?: AiChatStreamEventResolvers<ContextType>;
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  ChatMessage?: ChatMessageResolvers<ContextType>;
  ChatResponse?: ChatResponseResolvers<ContextType>;
  ChatSession?: ChatSessionResolvers<ContextType>;
  ChatSessionStreamEvent?: ChatSessionStreamEventResolvers<ContextType>;
  GenerationBatchReport?: GenerationBatchReportResolvers<ContextType>;
  GenerationItemResult?: GenerationItemResultResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Post?: PostResolvers<ContextType>;
  PostNeighbors?: PostNeighborsResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  SendChatMessagePayload?: SendChatMessagePayloadResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;
