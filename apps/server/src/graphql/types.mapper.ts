import type { Post, Comment, Notification, User } from './__generated__/types';

export type UserParent = Omit<
  User,
  'followerCount' | 'followingCount' | 'isFollowing' | 'postCount'
>;
export type PostParent = Omit<Post, 'interactionInfo' | 'excerpt' | 'author'> & {
  author: UserParent;
};
export type PostNeighborSummaryParent = {
  id: string;
  title: string;
  seriesKey?: string | null;
  seriesOrder?: number | null;
};
export type PostNeighborsParent = {
  prev: PostNeighborSummaryParent | null;
  next: PostNeighborSummaryParent | null;
};
export type CommentParent = Omit<Comment, 'replies' | 'repliesCount' | 'author'> & {
  author: UserParent;
  replies?: CommentParent[];
  repliesCount?: number;
};
export type NotificationParent = Omit<Notification, 'actor'> & { actor: UserParent };
