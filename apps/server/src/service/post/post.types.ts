import type { PostStatus } from '@/generated/prisma/client';
import type { PostWithAuthor } from './postSelect';

export interface ListPostsOptions {
  topic?: string;
  subtopic?: string;
  status?: PostStatus;
  search?: string;
  mine?: boolean;
  authorId?: string;
  limit?: number;
  offset?: number;
}

export interface PostNeighbors {
  prev: PostWithAuthor | null;
  next: PostWithAuthor | null;
}
