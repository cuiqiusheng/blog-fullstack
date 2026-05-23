import { useMutation, useQuery } from '@apollo/client/react';
import { Avatar, Button, Card, Empty, List, Space, Spin, Tag, Typography, theme } from 'antd';
import {
  UserOutlined,
  LikeOutlined,
  MessageOutlined,
  TeamOutlined,
  HeartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { UserProfileDocument, PostsDocument, ToggleFollowDocument } from '@/graphql/codegen';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';
import { getDisplayName } from '@/shared/utils/displayName';
import type { PostsQuery } from '@/graphql/codegen';
import type { ReactNode } from 'react';

type PostItem = PostsQuery['posts'][number];

const { Title, Text } = Typography;

interface StatBadgeProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatBadge({ icon, label, value, color }: StatBadgeProps) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainerDisabled,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: token.borderRadiusLG,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: token.colorTextSecondary, whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { currentUser } = useCurrentUser();
  const { guard, isAuthenticated } = useAuthGuard();

  const { data: profileData, loading: profileLoading } = useQuery(UserProfileDocument, {
    variables: { id: id! },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const { data: postsData, loading: postsLoading } = useQuery(PostsDocument, {
    variables: {
      authorId: id!,
      status: 'PUBLISHED' as never,
      limit: 20,
      offset: 0,
    },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const [toggleFollow, { loading: followLoading }] = useMutation(ToggleFollowDocument, {
    refetchQueries: [{ query: UserProfileDocument, variables: { id: id! } }],
  });

  if (id && isAuthenticated && currentUser?.id === id) {
    return <Navigate to="/profile" replace />;
  }

  if (profileLoading && !profileData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const profile = profileData?.userProfile;
  if (!profile) {
    return <Empty description={t('profile.userNotFound')} />;
  }

  const posts = postsData?.posts ?? [];
  const displayName = getDisplayName(profile);

  const handleToggleFollow = () => {
    guard(() => {
      toggleFollow({ variables: { userId: profile.id } });
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar
            size={80}
            src={profile.avatarUrl}
            icon={!profile.avatarUrl && <UserOutlined />}
            style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={3} style={{ margin: 0 }}>
              {displayName}
            </Title>
            <Text type="secondary">{profile.email}</Text>
          </div>
          <Button
            type={profile.isFollowing ? 'default' : 'primary'}
            loading={followLoading}
            onClick={handleToggleFollow}
          >
            {profile.isFollowing ? t('interaction.following') : t('interaction.follow')}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatBadge
            icon={<FileTextOutlined />}
            label={t('profile.postCount')}
            value={profile.postCount}
            color="#6366f1"
          />
          <StatBadge
            icon={<HeartOutlined />}
            label={t('profile.followerCount')}
            value={profile.followerCount}
            color="#f43f5e"
          />
          <StatBadge
            icon={<TeamOutlined />}
            label={t('profile.followingCount')}
            value={profile.followingCount}
            color="#3b82f6"
          />
        </div>
      </Card>

      {/* Articles */}
      <Card>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('profile.articles')}
        </Title>
        {postsLoading && posts.length === 0 ? (
          <Spin />
        ) : posts.length === 0 ? (
          <Empty description={t('profile.noArticles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List<PostItem>
            dataSource={posts}
            renderItem={(item: PostItem) => (
              <List.Item>
                <List.Item.Meta
                  title={<Link to={`/posts/${item.id}`}>{item.title}</Link>}
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary">{item.excerpt}</Text>
                      <Space wrap size={[8, 4]}>
                        {item.topic ? <Tag>{item.topic}</Tag> : null}
                        {item.subtopic ? <Tag>{item.subtopic}</Tag> : null}
                        <Text type="secondary">{dayjs(item.createdAt).format('YYYY-MM-DD')}</Text>
                        {item.interactionInfo && (
                          <>
                            <Text type="secondary">
                              <LikeOutlined /> {item.interactionInfo.likeCount}
                            </Text>
                            <Text type="secondary">
                              <MessageOutlined /> {item.interactionInfo.commentCount}
                            </Text>
                          </>
                        )}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
