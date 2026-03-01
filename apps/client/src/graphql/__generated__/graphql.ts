/* eslint-disable */
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
  model?: Maybe<Scalars['String']['output']>;
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

export type Comment = {
  __typename?: 'Comment';
  author: User;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  replies: Array<Comment>;
  repliesCount: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
};

export type CreatePostInput = {
  content: Scalars['String']['input'];
  status?: InputMaybe<PostStatus>;
  subtopic?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  topic?: InputMaybe<Scalars['String']['input']>;
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

export type InteractionStats = {
  __typename?: 'InteractionStats';
  totalBookmarks: Scalars['Int']['output'];
  totalComments: Scalars['Int']['output'];
  totalLikesReceived: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  aiChat: ChatResponse;
  archiveChatSession: ChatSession;
  changePassword: Scalars['Boolean']['output'];
  createComment: Comment;
  createPost: Post;
  deleteChatSession: Scalars['Boolean']['output'];
  deleteComment: Scalars['Boolean']['output'];
  deletePost: Scalars['Boolean']['output'];
  generatePosts: GenerationBatchReport;
  login: AuthPayload;
  markAllNotificationsRead: Scalars['Boolean']['output'];
  markNotificationRead: Notification;
  register: AuthPayload;
  renameChatSession: ChatSession;
  retryGenerationBatch: GenerationBatchReport;
  sendChatMessage: SendChatMessagePayload;
  startChatSession: ChatSession;
  toggleBookmark: PostInteractionInfo;
  toggleLike: PostInteractionInfo;
  updatePost: Post;
  updateProfile: User;
};

export type MutationAiChatArgs = {
  messages: Array<ChatMessageInput>;
  model?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
};

export type MutationArchiveChatSessionArgs = {
  sessionId: Scalars['ID']['input'];
};

export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type MutationCreateCommentArgs = {
  content: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  postId: Scalars['ID']['input'];
};

export type MutationCreatePostArgs = {
  input: CreatePostInput;
};

export type MutationDeleteChatSessionArgs = {
  sessionId: Scalars['ID']['input'];
};

export type MutationDeleteCommentArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeletePostArgs = {
  id: Scalars['ID']['input'];
};

export type MutationGeneratePostsArgs = {
  input: GeneratePostsInput;
};

export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
};

export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  nickname?: InputMaybe<Scalars['String']['input']>;
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

export type MutationToggleBookmarkArgs = {
  postId: Scalars['ID']['input'];
};

export type MutationToggleLikeArgs = {
  postId: Scalars['ID']['input'];
};

export type MutationUpdatePostArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePostInput;
};

export type MutationUpdateProfileArgs = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
};

export type Notification = {
  __typename?: 'Notification';
  actor: User;
  commentContent?: Maybe<Scalars['String']['output']>;
  commentId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  postId?: Maybe<Scalars['ID']['output']>;
  postTitle?: Maybe<Scalars['String']['output']>;
  read: Scalars['Boolean']['output'];
  type: NotificationType;
};

export enum NotificationType {
  Comment = 'COMMENT',
  Like = 'LIKE',
  Reply = 'REPLY',
}

export type Post = {
  __typename?: 'Post';
  author: User;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  generationBatchId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  interactionInfo: PostInteractionInfo;
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

export type PostInteractionInfo = {
  __typename?: 'PostInteractionInfo';
  bookmarkCount: Scalars['Int']['output'];
  bookmarked: Scalars['Boolean']['output'];
  commentCount: Scalars['Int']['output'];
  likeCount: Scalars['Int']['output'];
  liked: Scalars['Boolean']['output'];
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
  chatSessionsTotal: Scalars['Int']['output'];
  commentReplies: Array<Comment>;
  comments: Array<Comment>;
  commentsTotal: Scalars['Int']['output'];
  generationBatch: GenerationBatchReport;
  hello?: Maybe<Scalars['String']['output']>;
  me?: Maybe<User>;
  myBookmarks: Array<Post>;
  myBookmarksTotal: Scalars['Int']['output'];
  myInteractionStats: InteractionStats;
  notifications: Array<Notification>;
  post?: Maybe<Post>;
  postNeighbors: PostNeighbors;
  posts: Array<Post>;
  postsTotal: Scalars['Int']['output'];
  unreadNotificationCount: Scalars['Int']['output'];
};

export type QueryChatSessionArgs = {
  id: Scalars['ID']['input'];
};

export type QueryChatSessionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCommentRepliesArgs = {
  commentId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryCommentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};

export type QueryCommentsTotalArgs = {
  postId: Scalars['ID']['input'];
};

export type QueryGenerationBatchArgs = {
  batchId: Scalars['String']['input'];
};

export type QueryMyBookmarksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
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
  notificationReceived: Notification;
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

export type UpdatePostInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  subtopic?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  topic?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname?: Maybe<Scalars['String']['output']>;
  roles: Array<Role>;
};

export type ChatSessionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;

export type ChatSessionsQuery = {
  __typename?: 'Query';
  chatSessions: Array<{
    __typename?: 'ChatSession';
    id: string;
    title: string;
    status: ChatSessionStatus;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string | null;
  }>;
};

export type ChatSessionsTotalQueryVariables = Exact<{ [key: string]: never }>;

export type ChatSessionsTotalQuery = { __typename?: 'Query'; chatSessionsTotal: number };

export type ChatSessionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type ChatSessionQuery = {
  __typename?: 'Query';
  chatSession?: {
    __typename?: 'ChatSession';
    id: string;
    title: string;
    status: ChatSessionStatus;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string | null;
    messages: Array<{
      __typename?: 'ChatMessage';
      id: string;
      role: ChatRole;
      status: ChatMessageStatus;
      content: string;
      createdAt: string;
    }>;
  } | null;
};

export type StartChatSessionMutationVariables = Exact<{
  input?: InputMaybe<StartChatSessionInput>;
}>;

export type StartChatSessionMutation = {
  __typename?: 'Mutation';
  startChatSession: {
    __typename?: 'ChatSession';
    id: string;
    title: string;
    status: ChatSessionStatus;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string | null;
  };
};

export type SendChatMessageMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
}>;

export type SendChatMessageMutation = {
  __typename?: 'Mutation';
  sendChatMessage: {
    __typename?: 'SendChatMessagePayload';
    session: {
      __typename?: 'ChatSession';
      id: string;
      title: string;
      status: ChatSessionStatus;
      createdAt: string;
      updatedAt: string;
      lastMessageAt?: string | null;
    };
    userMessage: {
      __typename?: 'ChatMessage';
      id: string;
      role: ChatRole;
      status: ChatMessageStatus;
      content: string;
      createdAt: string;
    };
    assistantMessage: {
      __typename?: 'ChatMessage';
      id: string;
      role: ChatRole;
      status: ChatMessageStatus;
      content: string;
      createdAt: string;
    };
  };
};

export type ArchiveChatSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;

export type ArchiveChatSessionMutation = {
  __typename?: 'Mutation';
  archiveChatSession: {
    __typename?: 'ChatSession';
    id: string;
    status: ChatSessionStatus;
    updatedAt: string;
  };
};

export type DeleteChatSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;

export type DeleteChatSessionMutation = { __typename?: 'Mutation'; deleteChatSession: boolean };

export type ChatSessionStreamSubscriptionVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  messageId: Scalars['ID']['input'];
}>;

export type ChatSessionStreamSubscription = {
  __typename?: 'Subscription';
  chatSessionStream: {
    __typename?: 'ChatSessionStreamEvent';
    eventId: string;
    seq: number;
    type: ChatStreamEventType;
    sessionId: string;
    messageId: string;
    chunk: string;
    done: boolean;
    createdAt: string;
    model?: string | null;
    error?: string | null;
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me?: {
    __typename?: 'User';
    id: string;
    email: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    createdAt: string;
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
      nickname?: string | null;
      avatarUrl?: string | null;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
  };
};

export type RegisterMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  nickname?: InputMaybe<Scalars['String']['input']>;
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
      nickname?: string | null;
      avatarUrl?: string | null;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
  };
};

export type UpdateProfileMutationVariables = Exact<{
  nickname?: InputMaybe<Scalars['String']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateProfileMutation = {
  __typename?: 'Mutation';
  updateProfile: {
    __typename?: 'User';
    id: string;
    email: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
  };
};

export type ChangePasswordMutationVariables = Exact<{
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;

export type ChangePasswordMutation = { __typename?: 'Mutation'; changePassword: boolean };

export type ToggleLikeMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;

export type ToggleLikeMutation = {
  __typename?: 'Mutation';
  toggleLike: {
    __typename?: 'PostInteractionInfo';
    liked: boolean;
    likeCount: number;
    bookmarked: boolean;
    bookmarkCount: number;
    commentCount: number;
  };
};

export type ToggleBookmarkMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;

export type ToggleBookmarkMutation = {
  __typename?: 'Mutation';
  toggleBookmark: {
    __typename?: 'PostInteractionInfo';
    liked: boolean;
    likeCount: number;
    bookmarked: boolean;
    bookmarkCount: number;
    commentCount: number;
  };
};

export type CreateCommentMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type CreateCommentMutation = {
  __typename?: 'Mutation';
  createComment: {
    __typename?: 'Comment';
    id: string;
    content: string;
    parentId?: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
      __typename?: 'User';
      id: string;
      email: string;
      nickname?: string | null;
      avatarUrl?: string | null;
    };
  };
};

export type DeleteCommentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteCommentMutation = { __typename?: 'Mutation'; deleteComment: boolean };

export type CommentsQueryVariables = Exact<{
  postId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type CommentsQuery = {
  __typename?: 'Query';
  comments: Array<{
    __typename?: 'Comment';
    id: string;
    content: string;
    parentId?: string | null;
    repliesCount: number;
    createdAt: string;
    updatedAt: string;
    author: {
      __typename?: 'User';
      id: string;
      email: string;
      nickname?: string | null;
      avatarUrl?: string | null;
    };
    replies: Array<{
      __typename?: 'Comment';
      id: string;
      content: string;
      parentId?: string | null;
      createdAt: string;
      updatedAt: string;
      author: {
        __typename?: 'User';
        id: string;
        email: string;
        nickname?: string | null;
        avatarUrl?: string | null;
      };
    }>;
  }>;
};

export type CommentsTotalQueryVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;

export type CommentsTotalQuery = { __typename?: 'Query'; commentsTotal: number };

export type CommentRepliesQueryVariables = Exact<{
  commentId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type CommentRepliesQuery = {
  __typename?: 'Query';
  commentReplies: Array<{
    __typename?: 'Comment';
    id: string;
    content: string;
    parentId?: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
      __typename?: 'User';
      id: string;
      email: string;
      nickname?: string | null;
      avatarUrl?: string | null;
    };
  }>;
};

export type MyBookmarksQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type MyBookmarksQuery = {
  __typename?: 'Query';
  myBookmarks: Array<{
    __typename?: 'Post';
    id: string;
    title: string;
    content: string;
    topic?: string | null;
    subtopic?: string | null;
    status: PostStatus;
    createdAt: string;
    updatedAt: string;
    author: {
      __typename?: 'User';
      id: string;
      email: string;
      nickname?: string | null;
      avatarUrl?: string | null;
    };
    interactionInfo: {
      __typename?: 'PostInteractionInfo';
      liked: boolean;
      likeCount: number;
      bookmarked: boolean;
      bookmarkCount: number;
      commentCount: number;
    };
  }>;
};

export type MyBookmarksTotalQueryVariables = Exact<{ [key: string]: never }>;

export type MyBookmarksTotalQuery = { __typename?: 'Query'; myBookmarksTotal: number };

export type MyInteractionStatsQueryVariables = Exact<{ [key: string]: never }>;

export type MyInteractionStatsQuery = {
  __typename?: 'Query';
  myInteractionStats: {
    __typename?: 'InteractionStats';
    totalLikesReceived: number;
    totalBookmarks: number;
    totalComments: number;
  };
};

export type NotificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type NotificationsQuery = {
  __typename?: 'Query';
  notifications: Array<{
    __typename?: 'Notification';
    id: string;
    type: NotificationType;
    postId?: string | null;
    commentId?: string | null;
    postTitle?: string | null;
    commentContent?: string | null;
    read: boolean;
    createdAt: string;
    actor: {
      __typename?: 'User';
      id: string;
      email: string;
      nickname?: string | null;
      avatarUrl?: string | null;
    };
  }>;
};

export type UnreadNotificationCountQueryVariables = Exact<{ [key: string]: never }>;

export type UnreadNotificationCountQuery = {
  __typename?: 'Query';
  unreadNotificationCount: number;
};

export type MarkNotificationReadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type MarkNotificationReadMutation = {
  __typename?: 'Mutation';
  markNotificationRead: { __typename?: 'Notification'; id: string; read: boolean };
};

export type MarkAllNotificationsReadMutationVariables = Exact<{ [key: string]: never }>;

export type MarkAllNotificationsReadMutation = {
  __typename?: 'Mutation';
  markAllNotificationsRead: boolean;
};

export type NotificationReceivedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type NotificationReceivedSubscription = {
  __typename?: 'Subscription';
  notificationReceived: {
    __typename?: 'Notification';
    id: string;
    type: NotificationType;
    postId?: string | null;
    commentId?: string | null;
    postTitle?: string | null;
    commentContent?: string | null;
    read: boolean;
    createdAt: string;
    actor: {
      __typename?: 'User';
      id: string;
      email: string;
      nickname?: string | null;
      avatarUrl?: string | null;
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
      nickname?: string | null;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
    interactionInfo: {
      __typename?: 'PostInteractionInfo';
      liked: boolean;
      likeCount: number;
      bookmarked: boolean;
      bookmarkCount: number;
      commentCount: number;
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
      nickname?: string | null;
      roles: Array<{ __typename?: 'Role'; id: string; name: string }>;
    };
    interactionInfo: {
      __typename?: 'PostInteractionInfo';
      liked: boolean;
      likeCount: number;
      bookmarked: boolean;
      bookmarkCount: number;
      commentCount: number;
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

export type CreatePostMutationVariables = Exact<{
  input: CreatePostInput;
}>;

export type CreatePostMutation = {
  __typename?: 'Mutation';
  createPost: {
    __typename?: 'Post';
    id: string;
    title: string;
    status: PostStatus;
    createdAt: string;
  };
};

export type UpdatePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePostInput;
}>;

export type UpdatePostMutation = {
  __typename?: 'Mutation';
  updatePost: {
    __typename?: 'Post';
    id: string;
    title: string;
    status: PostStatus;
    updatedAt: string;
  };
};

export type DeletePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeletePostMutation = { __typename?: 'Mutation'; deletePost: boolean };

export const ChatSessionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ChatSessions' },
      variableDefinitions: [
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
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'chatSessions' },
            arguments: [
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastMessageAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ChatSessionsQuery, ChatSessionsQueryVariables>;
export const ChatSessionsTotalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ChatSessionsTotal' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'chatSessionsTotal' } }],
      },
    },
  ],
} as unknown as DocumentNode<ChatSessionsTotalQuery, ChatSessionsTotalQueryVariables>;
export const ChatSessionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ChatSession' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
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
            name: { kind: 'Name', value: 'chatSession' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastMessageAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'messages' },
                  arguments: [
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
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
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
} as unknown as DocumentNode<ChatSessionQuery, ChatSessionQueryVariables>;
export const StartChatSessionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'StartChatSession' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'StartChatSessionInput' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'startChatSession' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastMessageAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StartChatSessionMutation, StartChatSessionMutationVariables>;
export const SendChatMessageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendChatMessage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
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
            name: { kind: 'Name', value: 'sendChatMessage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sessionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'content' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'session' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastMessageAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userMessage' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'assistantMessage' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
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
} as unknown as DocumentNode<SendChatMessageMutation, SendChatMessageMutationVariables>;
export const ArchiveChatSessionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ArchiveChatSession' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
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
            name: { kind: 'Name', value: 'archiveChatSession' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sessionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ArchiveChatSessionMutation, ArchiveChatSessionMutationVariables>;
export const DeleteChatSessionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteChatSession' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
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
            name: { kind: 'Name', value: 'deleteChatSession' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sessionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteChatSessionMutation, DeleteChatSessionMutationVariables>;
export const ChatSessionStreamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'ChatSessionStream' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'messageId' } },
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
            name: { kind: 'Name', value: 'chatSessionStream' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sessionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sessionId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'messageId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'messageId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'eventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'seq' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sessionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'messageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'chunk' } },
                { kind: 'Field', name: { kind: 'Name', value: 'done' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'model' } },
                { kind: 'Field', name: { kind: 'Name', value: 'error' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ChatSessionStreamSubscription, ChatSessionStreamSubscriptionVariables>;
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
                { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
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
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'nickname' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'nickname' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'nickname' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
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
export const UpdateProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateProfile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'nickname' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'avatarUrl' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateProfile' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'nickname' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'nickname' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'avatarUrl' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'avatarUrl' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
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
} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const ChangePasswordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ChangePassword' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currentPassword' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'newPassword' } },
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
            name: { kind: 'Name', value: 'changePassword' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currentPassword' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currentPassword' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'newPassword' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'newPassword' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const ToggleLikeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ToggleLike' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
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
            name: { kind: 'Name', value: 'toggleLike' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'liked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'likeCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'bookmarked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'bookmarkCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ToggleLikeMutation, ToggleLikeMutationVariables>;
export const ToggleBookmarkDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ToggleBookmark' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
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
            name: { kind: 'Name', value: 'toggleBookmark' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'liked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'likeCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'bookmarked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'bookmarkCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ToggleBookmarkMutation, ToggleBookmarkMutationVariables>;
export const CreateCommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateComment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createComment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'content' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateCommentMutation, CreateCommentMutationVariables>;
export const DeleteCommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteComment' },
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
            name: { kind: 'Name', value: 'deleteComment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCommentMutation, DeleteCommentMutationVariables>;
export const CommentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Comments' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
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
            name: { kind: 'Name', value: 'comments' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'repliesCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'replies' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'author' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CommentsQuery, CommentsQueryVariables>;
export const CommentsTotalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CommentsTotal' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
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
            name: { kind: 'Name', value: 'commentsTotal' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CommentsTotalQuery, CommentsTotalQueryVariables>;
export const CommentRepliesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CommentReplies' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'commentId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
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
            name: { kind: 'Name', value: 'commentReplies' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'commentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'commentId' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CommentRepliesQuery, CommentRepliesQueryVariables>;
export const MyBookmarksDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyBookmarks' },
      variableDefinitions: [
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
            name: { kind: 'Name', value: 'myBookmarks' },
            arguments: [
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
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'interactionInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'liked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'likeCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bookmarked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bookmarkCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'commentCount' } },
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
} as unknown as DocumentNode<MyBookmarksQuery, MyBookmarksQueryVariables>;
export const MyBookmarksTotalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyBookmarksTotal' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'myBookmarksTotal' } }],
      },
    },
  ],
} as unknown as DocumentNode<MyBookmarksTotalQuery, MyBookmarksTotalQueryVariables>;
export const MyInteractionStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyInteractionStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myInteractionStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalLikesReceived' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalBookmarks' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalComments' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyInteractionStatsQuery, MyInteractionStatsQueryVariables>;
export const NotificationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Notifications' },
      variableDefinitions: [
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
            name: { kind: 'Name', value: 'notifications' },
            arguments: [
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
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'actor' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'postTitle' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentContent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'read' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<NotificationsQuery, NotificationsQueryVariables>;
export const UnreadNotificationCountDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UnreadNotificationCount' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'unreadNotificationCount' } }],
      },
    },
  ],
} as unknown as DocumentNode<UnreadNotificationCountQuery, UnreadNotificationCountQueryVariables>;
export const MarkNotificationReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkNotificationRead' },
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
            name: { kind: 'Name', value: 'markNotificationRead' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'read' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MarkNotificationReadMutation, MarkNotificationReadMutationVariables>;
export const MarkAllNotificationsReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkAllNotificationsRead' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'markAllNotificationsRead' } }],
      },
    },
  ],
} as unknown as DocumentNode<
  MarkAllNotificationsReadMutation,
  MarkAllNotificationsReadMutationVariables
>;
export const NotificationReceivedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'NotificationReceived' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notificationReceived' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'actor' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatarUrl' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'postTitle' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentContent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'read' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  NotificationReceivedSubscription,
  NotificationReceivedSubscriptionVariables
>;
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
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'interactionInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'liked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'likeCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bookmarked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bookmarkCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'commentCount' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'nickname' } },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'interactionInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'liked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'likeCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bookmarked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bookmarkCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'commentCount' } },
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
export const CreatePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreatePost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreatePostInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreatePostMutation, CreatePostMutationVariables>;
export const UpdatePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdatePostInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdatePostMutation, UpdatePostMutationVariables>;
export const DeletePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeletePost' },
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
            name: { kind: 'Name', value: 'deletePost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeletePostMutation, DeletePostMutationVariables>;
