import type { PostStatus } from '@/generated/prisma/client';

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

export interface PostNeighborSummary {
  id: string;
  title: string;
  seriesKey: string | null;
  seriesOrder: number | null;
}

export interface PostNeighbors {
  prev: PostNeighborSummary | null;
  next: PostNeighborSummary | null;
}
