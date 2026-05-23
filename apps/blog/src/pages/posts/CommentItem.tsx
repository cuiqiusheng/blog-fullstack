import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { Button, Input, List, Popconfirm, Space, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { CommentRepliesDocument } from '@/graphql/codegen';
import type { TopComment, ReplyComment } from './commentTypes';
import { AuthorInfo } from '@/shared/components/AuthorInfo';
import { ReplyItem } from './ReplyItem';

const { Text } = Typography;
const { TextArea } = Input;

export interface CommentItemProps {
  comment: TopComment;
  currentUserId?: string;
  highlightCommentId?: string | null;
  replyingTo: string | null;
  replyText: string;
  replyHint: string;
  submittingReply: boolean;
  onSetReplyingTo: (commentId: string | null, hint?: string) => void;
  onSetReplyText: (text: string) => void;
  onSubmitReply: (parentId: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<void>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function CommentItem({
  comment,
  currentUserId,
  highlightCommentId,
  replyingTo,
  replyText,
  replyHint,
  submittingReply,
  onSetReplyingTo,
  onSetReplyText,
  onSubmitReply,
  onDeleteComment,
  t,
}: CommentItemProps) {
  const { token } = theme.useToken();
  const needsAutoExpand =
    !!highlightCommentId &&
    highlightCommentId !== comment.id &&
    !comment.replies.some(r => r.id === highlightCommentId) &&
    comment.repliesCount > comment.replies.length;
  const [expanded, setExpanded] = useState(needsAutoExpand);
  const scrolledRef = useRef(false);

  const prevHighlightRef = useRef(highlightCommentId);
  useEffect(() => {
    if (highlightCommentId !== prevHighlightRef.current) {
      scrolledRef.current = false;
      prevHighlightRef.current = highlightCommentId;
    }
  }, [highlightCommentId]);

  const [fetchAllReplies, { data: allRepliesData, loading: loadingReplies }] = useLazyQuery(
    CommentRepliesDocument,
    { fetchPolicy: 'network-only' },
  );

  const previewReplies = comment.replies;
  const totalReplies = comment.repliesCount;
  const fullReplies = allRepliesData?.commentReplies;
  const displayReplies: ReplyComment[] = expanded && fullReplies ? fullReplies : previewReplies;
  const isReplyingHere = replyingTo === comment.id;
  const isSelfHighlighted = highlightCommentId === comment.id;
  const isReplyHighlighted = !!highlightCommentId && highlightCommentId !== comment.id;

  useEffect(() => {
    if (!highlightCommentId || scrolledRef.current) return;

    if (isSelfHighlighted) {
      scrolledRef.current = true;
      setTimeout(() => {
        document
          .getElementById(`comment-${comment.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    if (!isReplyHighlighted) return;

    const inPreview = previewReplies.some(r => r.id === highlightCommentId);
    if (inPreview) {
      scrolledRef.current = true;
      setTimeout(() => {
        document
          .getElementById(`comment-${highlightCommentId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    if (totalReplies > previewReplies.length) {
      fetchAllReplies({ variables: { commentId: comment.id, limit: 100 } });
    }
  }, [
    highlightCommentId,
    comment.id,
    isSelfHighlighted,
    isReplyHighlighted,
    previewReplies,
    totalReplies,
    fetchAllReplies,
  ]);

  useEffect(() => {
    if (!highlightCommentId || scrolledRef.current || !allRepliesData?.commentReplies) return;
    const found = allRepliesData.commentReplies.some(r => r.id === highlightCommentId);
    if (found) {
      scrolledRef.current = true;
      setTimeout(() => {
        document
          .getElementById(`comment-${highlightCommentId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [highlightCommentId, allRepliesData]);

  const handleExpand = () => {
    if (!expanded) {
      fetchAllReplies({ variables: { commentId: comment.id, limit: 100 } });
    }
    setExpanded(!expanded);
  };

  const handleReplyToTop = () => {
    onSetReplyingTo(comment.id);
  };

  const handleReplyToReply = (authorName: string) => {
    onSetReplyingTo(comment.id, authorName);
  };

  const handleDeleteReply = async (replyId: string) => {
    await onDeleteComment(replyId);
    if (expanded) {
      fetchAllReplies({ variables: { commentId: comment.id, limit: 100 } });
    }
  };

  return (
    <List.Item
      id={`comment-${comment.id}`}
      style={{
        display: 'block',
        padding: '12px 0',
        ...(isSelfHighlighted ? { background: 'rgba(22, 119, 255, 0.06)', borderRadius: 6 } : {}),
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={8}>
            <AuthorInfo author={comment.author} showCard avatarSize={24} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text>{comment.content}</Text>
          </div>
          <Space size={12} style={{ marginTop: 4 }}>
            <Button type="link" size="small" style={{ padding: 0 }} onClick={handleReplyToTop}>
              {t('interaction.reply')}
            </Button>
            {currentUserId === comment.author.id && (
              <Popconfirm
                title={t('interaction.deleteCommentConfirm')}
                onConfirm={() => onDeleteComment(comment.id)}
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

      {(displayReplies.length > 0 || isReplyingHere) && (
        <div
          style={{
            marginLeft: 40,
            marginTop: 8,
            paddingLeft: 12,
            borderLeft: `2px solid ${token.colorBorderSecondary}`,
          }}
        >
          {displayReplies.map(reply => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              currentUserId={currentUserId}
              highlighted={highlightCommentId === reply.id}
              onReply={handleReplyToReply}
              onDelete={handleDeleteReply}
              t={t}
            />
          ))}

          {totalReplies > previewReplies.length && (
            <Button
              type="link"
              size="small"
              style={{ padding: 0, marginTop: 4 }}
              loading={loadingReplies}
              onClick={handleExpand}
            >
              {expanded
                ? t('interaction.collapseReplies')
                : t('interaction.expandReplies', { count: totalReplies })}
            </Button>
          )}

          {isReplyingHere && (
            <div style={{ marginTop: 8 }}>
              <TextArea
                rows={2}
                value={replyText}
                onChange={e => onSetReplyText(e.target.value)}
                placeholder={replyHint || t('interaction.replyPlaceholder')}
                maxLength={2000}
                autoFocus
              />
              <Space style={{ marginTop: 6 }}>
                <Button
                  type="primary"
                  size="small"
                  onClick={async () => {
                    const ok = await onSubmitReply(comment.id);
                    if (ok) {
                      setExpanded(true);
                      fetchAllReplies({ variables: { commentId: comment.id, limit: 100 } });
                    }
                  }}
                  loading={submittingReply}
                  disabled={!replyText.trim()}
                >
                  {t('interaction.reply')}
                </Button>
                <Button size="small" onClick={() => onSetReplyingTo(null)}>
                  {t('interaction.cancelReply')}
                </Button>
              </Space>
            </div>
          )}
        </div>
      )}
    </List.Item>
  );
}
