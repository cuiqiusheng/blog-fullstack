import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import { postAuthorInclude } from '../post/postSelect';

const COMMENT_AUTHOR_SELECT = {
  id: true,
  email: true,
  nickname: true,
  avatarUrl: true,
  createdAt: true,
  roles: { select: { id: true, name: true, description: true } },
} as const;

export async function getPostInteractionInfo(postId: string, userId: string | null) {
  const [likeCount, bookmarkCount, commentCount, liked, bookmarked] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    prisma.postBookmark.count({ where: { postId } }),
    prisma.postComment.count({ where: { postId } }),
    userId
      ? prisma.postLike.findUnique({ where: { userId_postId: { userId, postId } } }).then(Boolean)
      : false,
    userId
      ? prisma.postBookmark
          .findUnique({ where: { userId_postId: { userId, postId } } })
          .then(Boolean)
      : false,
  ]);
  return { liked, likeCount, bookmarked, bookmarkCount, commentCount };
}

export async function toggleLike(userId: string, postId: string) {
  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
  } else {
    await prisma.postLike.create({ data: { userId, postId } });
  }
  return getPostInteractionInfo(postId, userId);
}

export async function toggleBookmark(userId: string, postId: string) {
  const existing = await prisma.postBookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await prisma.postBookmark.delete({ where: { userId_postId: { userId, postId } } });
  } else {
    await prisma.postBookmark.create({ data: { userId, postId } });
  }
  return getPostInteractionInfo(postId, userId);
}

export async function getComments(postId: string, limit = 20, offset = 0) {
  const rows = await prisma.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { user: { select: COMMENT_AUTHOR_SELECT } },
  });
  return rows.map(r => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    author: { ...r.user, createdAt: r.user.createdAt.toISOString() },
  }));
}

export async function getCommentsTotal(postId: string) {
  return prisma.postComment.count({ where: { postId } });
}

export async function createComment(userId: string, postId: string, content: string) {
  const row = await prisma.postComment.create({
    data: { userId, postId, content },
    include: { user: { select: COMMENT_AUTHOR_SELECT } },
  });
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: { ...row.user, createdAt: row.user.createdAt.toISOString() },
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new GraphQLError('Comment not found', { extensions: { code: 'NOT_FOUND' } });
  }
  if (comment.userId !== userId) {
    throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
  }
  await prisma.postComment.delete({ where: { id: commentId } });
  return true;
}

export async function getMyBookmarks(userId: string, limit = 20, offset = 0) {
  const rows = await prisma.postBookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { post: { include: postAuthorInclude } },
  });
  return rows.map(r => r.post);
}

export async function getMyBookmarksTotal(userId: string) {
  return prisma.postBookmark.count({ where: { userId } });
}

export async function getUserInteractionStats(userId: string) {
  const [totalLikesReceived, totalBookmarks, totalComments] = await Promise.all([
    prisma.postLike.count({
      where: { post: { authorId: userId } },
    }),
    prisma.postBookmark.count({ where: { userId } }),
    prisma.postComment.count({ where: { userId } }),
  ]);
  return { totalLikesReceived, totalBookmarks, totalComments };
}
