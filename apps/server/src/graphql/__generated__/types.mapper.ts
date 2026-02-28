import type { Post, Comment, Notification } from './types';

export type PostParent = Omit<Post, 'interactionInfo'>;
export type CommentParent = Omit<Comment, 'replies' | 'repliesCount'> & {
  replies?: CommentParent[];
  repliesCount?: number;
};
export type NotificationParent = Notification;
