import { Button, Popconfirm, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ReplyComment } from './commentTypes';
import { getDisplayName } from './commentTypes';
import { AuthorInfo } from '@/shared/components/AuthorInfo';

const { Text } = Typography;

interface ReplyItemProps {
  reply: ReplyComment;
  currentUserId?: string;
  highlighted?: boolean;
  onReply: (replyAuthorName: string) => void;
  onDelete: (commentId: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function ReplyItem({
  reply,
  currentUserId,
  highlighted,
  onReply,
  onDelete,
  t,
}: ReplyItemProps) {
  return (
    <div
      id={`comment-${reply.id}`}
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 0',
        ...(highlighted
          ? { background: 'rgba(22, 119, 255, 0.06)', borderRadius: 6, padding: '8px 6px' }
          : {}),
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Space size={8}>
          <AuthorInfo author={reply.author} showCard avatarSize={22} fontSize={13} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
          </Text>
        </Space>
        <div style={{ marginTop: 2 }}>
          <Text>{reply.content}</Text>
        </div>
        <Space size={12} style={{ marginTop: 4 }}>
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => onReply(getDisplayName(reply.author))}
          >
            {t('interaction.reply')}
          </Button>
          {currentUserId === reply.author.id && (
            <Popconfirm
              title={t('interaction.deleteCommentConfirm')}
              onConfirm={() => onDelete(reply.id)}
              okText={t('common.ok')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" size="small" danger style={{ padding: 0 }}>
                {t('interaction.deleteComment')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>
    </div>
  );
}
