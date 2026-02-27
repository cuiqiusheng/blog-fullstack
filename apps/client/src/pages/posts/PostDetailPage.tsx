import { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  List,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  StarOutlined,
  StarFilled,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import { estimateReadMinutes } from '@blog-fullstack/content-utils';
import {
  DeletePostDocument,
  PostDocument,
  PostNeighborsDocument,
  PostsDocument,
  PostsTotalDocument,
  PostStatus,
  UpdatePostDocument,
  ToggleLikeDocument,
  ToggleBookmarkDocument,
  CommentsDocument,
  CommentsTotalDocument,
  CreateCommentDocument,
  DeleteCommentDocument,
  CommentRepliesDocument,
  type CommentsQuery,
} from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/hooks';
import { statusColor } from '@/features/posts/postUtils';
import './posts.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const COMMENTS_PAGE_SIZE = 10;

type TopComment = CommentsQuery['comments'][number];
type ReplyComment = TopComment['replies'][number];

function getDisplayName(author: { nickname?: string | null; email: string }) {
  return author.nickname || author.email.split('@')[0];
}

interface ReplyItemProps {
  reply: ReplyComment;
  currentUserId?: string;
  onReply: (replyAuthorName: string) => void;
  onDelete: (commentId: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function ReplyItem({ reply, currentUserId, onReply, onDelete, t }: ReplyItemProps) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
      <Avatar size="small" src={reply.author.avatarUrl || undefined} icon={<UserOutlined />} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Space size={8}>
          <Text strong style={{ fontSize: 13 }}>
            {getDisplayName(reply.author)}
          </Text>
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

interface CommentItemProps {
  comment: TopComment;
  currentUserId?: string;
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

function CommentItem({
  comment,
  currentUserId,
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
  const [expanded, setExpanded] = useState(false);

  const [fetchAllReplies, { data: allRepliesData, loading: loadingReplies }] = useLazyQuery(
    CommentRepliesDocument,
    { fetchPolicy: 'network-only' },
  );

  const previewReplies = comment.replies;
  const totalReplies = comment.repliesCount;
  const fullReplies = allRepliesData?.commentReplies;
  const displayReplies: ReplyComment[] = expanded && fullReplies ? fullReplies : previewReplies;
  const isReplyingHere = replyingTo === comment.id;

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
    <List.Item style={{ display: 'block', padding: '12px 0' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Avatar size="small" src={comment.author.avatarUrl || undefined} icon={<UserOutlined />} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={8}>
            <Text strong>{getDisplayName(comment.author)}</Text>
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

      {/* Replies */}
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

export function PostDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentUser } = useCurrentUser();
  const [commentText, setCommentText] = useState('');
  const [commentPage, setCommentPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyHint, setReplyHint] = useState('');

  const { data, loading, error } = useQuery(PostDocument, {
    variables: { id: id ?? '' },
    skip: !id,
  });
  const { data: neighborsData } = useQuery(PostNeighborsDocument, {
    variables: { id: id ?? '' },
    skip: !id,
  });
  const { data: commentsData, loading: commentsLoading } = useQuery(CommentsDocument, {
    variables: {
      postId: id ?? '',
      limit: COMMENTS_PAGE_SIZE,
      offset: (commentPage - 1) * COMMENTS_PAGE_SIZE,
    },
    skip: !id,
  });
  const { data: commentsTotalData } = useQuery(CommentsTotalDocument, {
    variables: { postId: id ?? '' },
    skip: !id,
  });

  const commentRefetchQueries = [
    {
      query: CommentsDocument,
      variables: {
        postId: id ?? '',
        limit: COMMENTS_PAGE_SIZE,
        offset: (commentPage - 1) * COMMENTS_PAGE_SIZE,
      },
    },
    { query: CommentsTotalDocument, variables: { postId: id ?? '' } },
    { query: PostDocument, variables: { id: id ?? '' } },
  ];

  const refetchQueries = [PostsDocument, PostsTotalDocument];

  const [publishPost, { loading: publishing }] = useMutation(UpdatePostDocument, {
    refetchQueries,
  });
  const [deletePost, { loading: deleting }] = useMutation(DeletePostDocument, {
    refetchQueries,
  });
  const [toggleLike] = useMutation(ToggleLikeDocument);
  const [toggleBookmark] = useMutation(ToggleBookmarkDocument);
  const [createComment, { loading: submittingComment }] = useMutation(CreateCommentDocument, {
    refetchQueries: commentRefetchQueries,
  });
  const [deleteComment] = useMutation(DeleteCommentDocument, {
    refetchQueries: commentRefetchQueries,
    awaitRefetchQueries: true,
  });

  if (!id) {
    return <Alert type="error" message={t('posts.detail.invalidId')} />;
  }
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Spin />
      </div>
    );
  }
  if (error) {
    return <Alert type="error" message={error.message} showIcon />;
  }
  if (!data?.post) {
    return <Empty description={t('posts.detail.notFound')} />;
  }

  const post = data.post;
  const interaction = post.interactionInfo;
  const from = new URLSearchParams(location.search).get('from');
  const backTarget = from && from.startsWith('/') ? from : '/posts';
  const isAuthor = currentUser?.id === post.author.id;

  const handlePublish = async () => {
    try {
      await publishPost({
        variables: { id, input: { status: PostStatus.Published } },
      });
      message.success(t('posts.detail.publishSuccess'));
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost({ variables: { id } });
      message.success(t('posts.detail.deleteSuccess'));
      navigate(backTarget);
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const handleToggleLike = async () => {
    await toggleLike({
      variables: { postId: id },
      refetchQueries: [{ query: PostDocument, variables: { id } }],
    });
  };

  const handleToggleBookmark = async () => {
    await toggleBookmark({
      variables: { postId: id },
      refetchQueries: [{ query: PostDocument, variables: { id } }],
    });
  };

  const handleSubmitComment = async () => {
    const content = commentText.trim();
    if (!content) return;
    try {
      await createComment({ variables: { postId: id, content } });
      setCommentText('');
      setCommentPage(1);
      message.success(t('interaction.commentCreated'));
    } catch {
      message.error(t('interaction.commentFailed'));
    }
  };

  const handleSubmitReply = async (parentId: string): Promise<boolean> => {
    const content = replyText.trim();
    if (!content) return false;
    try {
      await createComment({ variables: { postId: id, content, parentId } });
      setReplyText('');
      setReplyingTo(null);
      setReplyHint('');
      message.success(t('interaction.commentCreated'));
      return true;
    } catch {
      message.error(t('interaction.commentFailed'));
      return false;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({ variables: { id: commentId } });
      message.success(t('interaction.commentDeleted'));
    } catch {
      message.error(t('interaction.commentFailed'));
    }
  };

  const handleSetReplyingTo = (commentId: string | null, authorName?: string) => {
    setReplyingTo(commentId);
    setReplyText('');
    setReplyHint(authorName ? t('interaction.replyTo', { name: authorName }) : '');
  };

  return (
    <div className="post-detail">
      <Card>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => navigate(backTarget)}>{t('posts.detail.backToList')}</Button>
          {isAuthor && (
            <Space>
              <Button onClick={() => navigate(`/posts/${id}/edit`)}>
                {t('posts.detail.edit')}
              </Button>
              {post.status === PostStatus.Draft && (
                <Button type="primary" onClick={handlePublish} loading={publishing}>
                  {t('posts.detail.publish')}
                </Button>
              )}
              <Popconfirm
                title={t('posts.detail.deleteConfirm')}
                onConfirm={handleDelete}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
              >
                <Button danger loading={deleting}>
                  {t('posts.detail.delete')}
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>
        <div className="post-detail__header">
          <Title level={2} style={{ marginBottom: 8 }}>
            {post.title}
          </Title>
          <Space className="post-detail__meta" size={[8, 8]}>
            {post.seriesOrder != null ? (
              <Tag color="blue">{t('posts.meta.seriesOrder', { order: post.seriesOrder })}</Tag>
            ) : null}
            <Tag color={statusColor(post.status)}>
              {t(`posts.status.${post.status.toLowerCase()}`)}
            </Tag>
            {post.topic ? <Tag>{post.topic}</Tag> : null}
            {post.subtopic ? <Tag>{post.subtopic}</Tag> : null}
            <Text type="secondary">
              {t('posts.meta.author')}: {post.author.email}
            </Text>
            <Text type="secondary">
              {t('posts.meta.createdAt')}: {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Text type="secondary">
              {t('posts.meta.updatedAt')}: {dayjs(post.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Text type="secondary">
              {t('posts.meta.readTime')}: {estimateReadMinutes(post.content)}{' '}
              {t('posts.meta.minuteUnit')}
            </Text>
          </Space>
        </div>
        <MarkdownRenderer content={post.content} className="post-markdown" />

        {/* Interaction bar */}
        <Divider />
        <Space size={24}>
          <Tooltip title={interaction.liked ? t('interaction.liked') : t('interaction.like')}>
            <Button
              type="text"
              icon={
                interaction.liked ? <LikeFilled style={{ color: '#1677ff' }} /> : <LikeOutlined />
              }
              onClick={handleToggleLike}
            >
              {interaction.likeCount > 0 ? interaction.likeCount : ''}
            </Button>
          </Tooltip>
          <Tooltip
            title={interaction.bookmarked ? t('interaction.bookmarked') : t('interaction.bookmark')}
          >
            <Button
              type="text"
              icon={
                interaction.bookmarked ? (
                  <StarFilled style={{ color: '#faad14' }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={handleToggleBookmark}
            >
              {interaction.bookmarkCount > 0 ? interaction.bookmarkCount : ''}
            </Button>
          </Tooltip>
          <Tooltip title={t('interaction.comment')}>
            <Button type="text" icon={<MessageOutlined />}>
              {interaction.commentCount > 0 ? interaction.commentCount : ''}
            </Button>
          </Tooltip>
        </Space>

        {/* Navigation */}
        <div className="post-detail__nav">
          <Button
            disabled={!neighborsData?.postNeighbors.prev}
            onClick={() => {
              if (neighborsData?.postNeighbors.prev) {
                navigate(`/posts/${neighborsData.postNeighbors.prev.id}`);
              }
            }}
          >
            {t('posts.detail.prev')}
          </Button>
          <Button
            type="primary"
            disabled={!neighborsData?.postNeighbors.next}
            onClick={() => {
              if (neighborsData?.postNeighbors.next) {
                navigate(`/posts/${neighborsData.postNeighbors.next.id}`);
              }
            }}
          >
            {t('posts.detail.next')}
          </Button>
        </div>
      </Card>

      {/* Comments section */}
      <Card style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('interaction.comment')} ({commentsTotalData?.commentsTotal ?? 0})
        </Title>

        <div style={{ marginBottom: 16 }}>
          <TextArea
            rows={3}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={t('interaction.commentPlaceholder')}
            maxLength={2000}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={handleSubmitComment}
              loading={submittingComment}
              disabled={!commentText.trim()}
            >
              {t('interaction.submitComment')}
            </Button>
          </div>
        </div>

        <List
          loading={commentsLoading}
          dataSource={commentsData?.comments ?? []}
          locale={{ emptyText: <Empty description={t('interaction.noComments')} /> }}
          pagination={
            (commentsTotalData?.commentsTotal ?? 0) > COMMENTS_PAGE_SIZE
              ? {
                  current: commentPage,
                  total: commentsTotalData?.commentsTotal ?? 0,
                  pageSize: COMMENTS_PAGE_SIZE,
                  onChange: setCommentPage,
                  size: 'small',
                }
              : false
          }
          renderItem={comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              replyingTo={replyingTo}
              replyText={replyText}
              replyHint={replyHint}
              submittingReply={submittingComment}
              onSetReplyingTo={handleSetReplyingTo}
              onSetReplyText={setReplyText}
              onSubmitReply={handleSubmitReply}
              onDeleteComment={handleDeleteComment}
              t={t}
            />
          )}
        />
      </Card>
    </div>
  );
}
