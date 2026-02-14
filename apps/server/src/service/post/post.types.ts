import type { PostStatus } from '@/generated/prisma/client';
import type { PostWithAuthor } from './postSelect';

export type PostSortField = 'createdAt' | 'updatedAt' | 'subtopic';
export type SortDirection = 'asc' | 'desc';

export interface ListPostsOptions {
  topic?: string;
  subtopic?: string;
  status?: PostStatus;
  search?: string;
  sortBy?: PostSortField;
  sortDirection?: SortDirection;
  mine?: boolean;
  authorId?: string;
  limit?: number;
  offset?: number;
}

export interface PostNeighbors {
  prev: PostWithAuthor | null;
  next: PostWithAuthor | null;
}
