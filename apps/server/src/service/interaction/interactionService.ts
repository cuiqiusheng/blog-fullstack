import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import { NotificationType, PostVisibility } from '@/generated/prisma/client';
import { assertPostVisibleToViewer, canViewerReadPost } from '../post/postVisibility';
import { postAuthorInclude } from '../post/postSelect';
import { createNotification } from '../notification';

const COMMENT_AUTHOR_SELECT = {
  id: true,
  email: true,
  nickname: true,
  avatarUrl: true,
  createdAt: true,
  roles: { select: { id: true, name: true, description: true } },
} as const;

const REPLIES_PREVIEW_LIMIT = 3;

function mapComment(r: {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    nickname: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    roles: { id: string; name: string; description: string | null }[];
  };
}) {
  return {
    id: r.id,
    content: r.content,
    parentId: r.parentId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    author: { ...r.user, createdAt: r.user.createdAt.toISOString() },
  };
}

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
  await assertPostVisibleToViewer(postId, userId);
  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
  } else {
    await prisma.postLike.create({ data: { userId, postId } });
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true },
    });
    if (post) {
      createNotification({
        recipientId: post.authorId,
        actorId: userId,
        type: NotificationType.LIKE,
        postId,
        postTitle: post.title,
      });
    }
  }
  return getPostInteractionInfo(postId, userId);
}

export async function toggleBookmark(userId: string, postId: string) {
  await assertPostVisibleToViewer(postId, userId);
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

export async function getComments(
  postId: string,
  limit = 20,
  offset = 0,
  viewerUserId: string | null = null,
) {
  if (!(await canViewerReadPost(postId, viewerUserId))) {
    return [];
  }
  const rows = await prisma.postComment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: { select: COMMENT_AUTHOR_SELECT },
      replies: {
        take: REPLIES_PREVIEW_LIMIT,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: COMMENT_AUTHOR_SELECT } },
      },
      _count: { select: { replies: true } },
    },
  });
  return rows.map(r => ({
    ...mapComment(r),
    replies: r.replies.map(mapComment),
    repliesCount: r._count.replies,
  }));
}

export async function getCommentsTotal(postId: string, viewerUserId: string | null = null) {
  if (!(await canViewerReadPost(postId, viewerUserId))) {
    return 0;
  }
  return prisma.postComment.count({ where: { postId, parentId: null } });
}

export async function getCommentReplies(
  commentId: string,
  limit = 20,
  offset = 0,
  viewerUserId: string | null = null,
) {
  const parentMeta = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { postId: true },
  });
  if (!parentMeta || !(await canViewerReadPost(parentMeta.postId, viewerUserId))) {
    return [];
  }
  const rows = await prisma.postComment.findMany({
    where: { parentId: commentId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    skip: offset,
    include: { user: { select: COMMENT_AUTHOR_SELECT } },
  });
  return rows.map(r => ({
    ...mapComment(r),
    replies: [] as ReturnType<typeof mapComment>[],
    repliesCount: 0,
  }));
}

export async function createComment(
  userId: string,
  postId: string,
  content: string,
  parentId?: string | null,
) {
  await assertPostVisibleToViewer(postId, userId);
  let resolvedParentId = parentId ?? null;

  if (resolvedParentId) {
    const parentComment = await prisma.postComment.findUnique({
      where: { id: resolvedParentId },
    });
    if (!parentComment) {
      throw new GraphQLError('Parent comment not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (parentComment.postId !== postId) {
      throw new GraphQLError('Parent comment belongs to a different post', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (parentComment.parentId) {
      resolvedParentId = parentComment.parentId;
    }
  }

  const row = await prisma.postComment.create({
    data: { userId, postId, content, parentId: resolvedParentId },
    include: { user: { select: COMMENT_AUTHOR_SELECT } },
  });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true },
  });

  if (resolvedParentId) {
    const parentComment = await prisma.postComment.findUnique({
      where: { id: resolvedParentId },
      select: { userId: true },
    });
    if (parentComment) {
      createNotification({
        recipientId: parentComment.userId,
        actorId: userId,
        type: NotificationType.REPLY,
        postId,
        commentId: row.id,
        postTitle: post?.title,
        commentContent: content,
      });
    }
  } else if (post) {
    createNotification({
      recipientId: post.authorId,
      actorId: userId,
      type: NotificationType.COMMENT,
      postId,
      commentId: row.id,
      postTitle: post.title,
      commentContent: content,
    });
  }

  return {
    ...mapComment(row),
    replies: [] as ReturnType<typeof mapComment>[],
    repliesCount: 0,
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new GraphQLError('Comment not found', { extensions: { code: 'NOT_FOUND' } });
  }
  await assertPostVisibleToViewer(comment.postId, userId);
  if (comment.userId !== userId) {
    throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
  }
  await prisma.postComment.delete({ where: { id: commentId } });
  return true;
}

const bookmarkPostReadableWhere = (bookmarkOwnerId: string) => ({
  OR: [
    { visibility: PostVisibility.PUBLIC },
    { AND: [{ visibility: PostVisibility.PRIVATE }, { authorId: bookmarkOwnerId }] },
  ],
});

export async function getMyBookmarks(userId: string, limit = 20, offset = 0) {
  const rows = await prisma.postBookmark.findMany({
    where: {
      userId,
      post: bookmarkPostReadableWhere(userId),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { post: { include: postAuthorInclude } },
  });
  return rows.map(r => r.post);
}

export async function getMyBookmarksTotal(userId: string) {
  return prisma.postBookmark.count({
    where: { userId, post: bookmarkPostReadableWhere(userId) },
  });
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
