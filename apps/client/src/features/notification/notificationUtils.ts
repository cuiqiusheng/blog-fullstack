import { NotificationType } from '@/graphql/codegen';

const CONTENT_PREVIEW_LENGTH = 30;

export function getNotificationI18nKey(type: NotificationType, postTitle?: string | null): string {
  switch (type) {
    case NotificationType.Like:
      return postTitle ? 'notification.like' : 'notification.likeNoTitle';
    case NotificationType.Comment:
      return postTitle ? 'notification.comment' : 'notification.commentNoTitle';
    case NotificationType.Reply:
      return postTitle ? 'notification.replyWithTitle' : 'notification.reply';
  }
}

export function truncateContent(content: string | null | undefined): string | undefined {
  if (!content) return undefined;
  if (content.length <= CONTENT_PREVIEW_LENGTH) return content;
  return content.slice(0, CONTENT_PREVIEW_LENGTH) + '...';
}
