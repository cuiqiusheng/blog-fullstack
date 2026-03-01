import { GraphQLError } from 'graphql';
import { NotificationType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { createNotification } from '../notification';

const USER_SELECT = {
  id: true,
  email: true,
  nickname: true,
  avatarUrl: true,
  createdAt: true,
  roles: { select: { id: true, name: true, description: true } },
} as const;

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new GraphQLError('Cannot follow yourself', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
  if (!targetUser) {
    throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
  }

  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.userFollow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  } else {
    await prisma.userFollow.create({ data: { followerId, followingId } });
    createNotification({
      recipientId: followingId,
      actorId: followerId,
      type: NotificationType.FOLLOW,
    });
  }

  return getFollowInfo(followerId, followingId);
}

export async function getFollowInfo(followerId: string, followingId: string) {
  const [isFollowing, followerCount] = await Promise.all([
    prisma.userFollow
      .findUnique({ where: { followerId_followingId: { followerId, followingId } } })
      .then(Boolean),
    prisma.userFollow.count({ where: { followingId } }),
  ]);
  return { following: isFollowing, followerCount };
}

export async function getFollowing(userId: string, limit = 20, offset = 0) {
  const rows = await prisma.userFollow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { following: { select: USER_SELECT } },
  });
  return rows.map(r => ({
    ...r.following,
    createdAt: r.following.createdAt.toISOString(),
  }));
}

export async function getFollowers(userId: string, limit = 20, offset = 0) {
  const rows = await prisma.userFollow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { follower: { select: USER_SELECT } },
  });
  return rows.map(r => ({
    ...r.follower,
    createdAt: r.follower.createdAt.toISOString(),
  }));
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) {
    throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
  }
  return { ...user, createdAt: user.createdAt.toISOString() };
}
