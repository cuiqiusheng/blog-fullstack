import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
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
} from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/hooks';
import { statusColor } from '@/features/posts/postUtils';
import './posts.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const COMMENTS_PAGE_SIZE = 10;

export function PostDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentUser } = useCurrentUser();
  const [commentText, setCommentText] = useState('');
  const [commentPage, setCommentPage] = useState(1);

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
    refetchQueries: [
      {
        query: CommentsDocument,
        variables: { postId: id ?? '', limit: COMMENTS_PAGE_SIZE, offset: 0 },
      },
      { query: CommentsTotalDocument, variables: { postId: id ?? '' } },
      { query: PostDocument, variables: { id: id ?? '' } },
    ],
  });
  const [deleteComment] = useMutation(DeleteCommentDocument, {
    refetchQueries: [
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
    ],
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({ variables: { id: commentId } });
      message.success(t('interaction.commentDeleted'));
    } catch {
      message.error(t('interaction.commentFailed'));
    }
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
          renderItem={item => (
            <List.Item
              actions={
                currentUser?.id === item.author.id
                  ? [
                      <Popconfirm
                        key="delete"
                        title={t('interaction.deleteCommentConfirm')}
                        onConfirm={() => handleDeleteComment(item.id)}
                        okText={t('common.ok')}
                        cancelText={t('common.cancel')}
                      >
                        <Button type="link" size="small" danger>
                          {t('interaction.deleteComment')}
                        </Button>
                      </Popconfirm>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size="small"
                    src={item.author.avatarUrl || undefined}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <Space size={8}>
                    <Text strong>{item.author.nickname || item.author.email.split('@')[0]}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </Space>
                }
                description={<Text>{item.content}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
