import { useQuery } from '@apollo/client/react';
import { Alert, Button, Card, Empty, Space, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import { estimateReadMinutes } from '@blog-fullstack/content-utils';
import { PostDocument, PostNeighborsDocument, PostStatus } from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';
import './posts.css';

const { Title, Text } = Typography;

function statusColor(status: PostStatus): string {
  switch (status) {
    case PostStatus.Published:
      return 'green';
    case PostStatus.Draft:
      return 'orange';
    default:
      return 'default';
  }
}

export function PostDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(PostDocument, {
    variables: { id: id ?? '' },
    skip: !id,
  });
  const { data: neighborsData } = useQuery(PostNeighborsDocument, {
    variables: { id: id ?? '' },
    skip: !id,
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
  const from = new URLSearchParams(location.search).get('from');
  const backTarget = from && from.startsWith('/') ? from : '/posts';

  return (
    <div className="post-detail">
      <Card>
        <div style={{ marginBottom: 12 }}>
          <Button onClick={() => navigate(backTarget)}>{t('posts.detail.backToList')}</Button>
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
    </div>
  );
}
