import DataLoader from 'dataloader';
import { prisma } from '@/lib/prisma';

export interface PostInteractionInfo {
  liked: boolean;
  likeCount: number;
  bookmarked: boolean;
  bookmarkCount: number;
  commentCount: number;
}

export function createInteractionLoader(userId: string | null) {
  return new DataLoader<string, PostInteractionInfo>(async postIds => {
    const ids = [...postIds];

    const [likeCounts, bookmarkCounts, commentCounts, userLikes, userBookmarks] = await Promise.all(
      [
        prisma.postLike.groupBy({
          by: ['postId'],
          where: { postId: { in: ids } },
          _count: { postId: true },
        }),
        prisma.postBookmark.groupBy({
          by: ['postId'],
          where: { postId: { in: ids } },
          _count: { postId: true },
        }),
        prisma.postComment.groupBy({
          by: ['postId'],
          where: { postId: { in: ids } },
          _count: { postId: true },
        }),
        userId
          ? prisma.postLike.findMany({
              where: { postId: { in: ids }, userId },
              select: { postId: true },
            })
          : Promise.resolve([]),
        userId
          ? prisma.postBookmark.findMany({
              where: { postId: { in: ids }, userId },
              select: { postId: true },
            })
          : Promise.resolve([]),
      ],
    );

    const likeCountMap = new Map(likeCounts.map(r => [r.postId, r._count.postId]));
    const bookmarkCountMap = new Map(bookmarkCounts.map(r => [r.postId, r._count.postId]));
    const commentCountMap = new Map(commentCounts.map(r => [r.postId, r._count.postId]));
    const likedSet = new Set(userLikes.map(r => r.postId));
    const bookmarkedSet = new Set(userBookmarks.map(r => r.postId));

    return ids.map(postId => ({
      liked: likedSet.has(postId),
      likeCount: likeCountMap.get(postId) ?? 0,
      bookmarked: bookmarkedSet.has(postId),
      bookmarkCount: bookmarkCountMap.get(postId) ?? 0,
      commentCount: commentCountMap.get(postId) ?? 0,
    }));
  });
}
