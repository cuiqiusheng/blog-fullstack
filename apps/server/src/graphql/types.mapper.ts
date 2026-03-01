import type { Post, Comment, Notification, User } from './__generated__/types';

export type UserParent = Omit<
  User,
  'followerCount' | 'followingCount' | 'isFollowing' | 'postCount'
>;
export type PostParent = Omit<Post, 'interactionInfo' | 'author'> & { author: UserParent };
export type CommentParent = Omit<Comment, 'replies' | 'repliesCount' | 'author'> & {
  author: UserParent;
  replies?: CommentParent[];
  repliesCount?: number;
};
export type NotificationParent = Omit<Notification, 'actor'> & { actor: UserParent };
