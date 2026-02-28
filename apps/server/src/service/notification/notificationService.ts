import { type Prisma, NotificationType } from '@/generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { pubsub, notificationTopic } from './pubsub';

const NOTIFICATION_ACTOR_SELECT = {
  id: true,
  email: true,
  nickname: true,
  avatarUrl: true,
  createdAt: true,
  roles: { select: { id: true, name: true, description: true } },
} as const;

const NOTIFICATION_INCLUDE = {
  actor: { select: NOTIFICATION_ACTOR_SELECT },
} satisfies Prisma.NotificationInclude;

type NotificationRow = Prisma.NotificationGetPayload<{ include: typeof NOTIFICATION_INCLUDE }>;

function mapNotification(row: NotificationRow) {
  return {
    id: row.id,
    type: row.type,
    postId: row.postId,
    commentId: row.commentId,
    postTitle: row.postTitle,
    commentContent: row.commentContent,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
    actor: { ...row.actor, createdAt: row.actor.createdAt.toISOString() },
  };
}

export async function createNotification(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
  postTitle?: string;
  commentContent?: string;
}) {
  if (params.recipientId === params.actorId) return;

  const row = await prisma.notification.create({
    data: {
      recipientId: params.recipientId,
      actorId: params.actorId,
      type: params.type,
      postId: params.postId ?? null,
      commentId: params.commentId ?? null,
      postTitle: params.postTitle ?? null,
      commentContent: params.commentContent ?? null,
    },
    include: NOTIFICATION_INCLUDE,
  });

  const mapped = mapNotification(row);
  pubsub.publish(notificationTopic(params.recipientId), {
    notificationReceived: mapped,
  });
}

export async function getNotifications(userId: string, limit = 20, offset = 0) {
  const rows = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: NOTIFICATION_INCLUDE,
  });
  return rows.map(mapNotification);
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, read: false },
  });
}

export async function markRead(notificationId: string, userId: string) {
  const row = await prisma.notification.update({
    where: { id: notificationId, recipientId: userId },
    data: { read: true },
    include: NOTIFICATION_INCLUDE,
  });
  return mapNotification(row);
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });
  return true;
}
