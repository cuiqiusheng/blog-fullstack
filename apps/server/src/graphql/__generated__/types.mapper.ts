import type { Post, Comment } from './types';

export type PostParent = Omit<Post, 'interactionInfo'>;
export type CommentParent = Omit<Comment, 'replies' | 'repliesCount'> & {
  replies?: CommentParent[];
  repliesCount?: number;
};
