import { useMutation, useQuery } from '@apollo/client/react';
import { Avatar, Button, Card, Empty, List, Space, Spin, Typography, theme } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  MessageOutlined,
  LikeOutlined,
  StarOutlined,
  CommentOutlined,
  TeamOutlined,
  HeartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PostsTotalDocument,
  ChatSessionsTotalDocument,
  MyInteractionStatsDocument,
  MyFollowingDocument,
  MyFollowersDocument,
  ToggleFollowDocument,
  UserProfileDocument,
} from '@/graphql/codegen';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { getDisplayName } from '@/shared/utils/displayName';
import type { MyFollowingQuery, MyFollowersQuery } from '@/graphql/codegen';
import type { ReactNode } from 'react';

type FollowingUser = MyFollowingQuery['myFollowing'][number];
type FollowerUser = MyFollowersQuery['myFollowers'][number];

const { Title, Text } = Typography;

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
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

export function ProfilePage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useCurrentUser();

  const { data: totalData } = useQuery(PostsTotalDocument, {
    variables: { mine: true },
    fetchPolicy: 'cache-and-network',
  });
  const { data: publishedData } = useQuery(PostsTotalDocument, {
    variables: { mine: true, status: 'PUBLISHED' as never },
    fetchPolicy: 'cache-and-network',
  });
  const { data: draftData } = useQuery(PostsTotalDocument, {
    variables: { mine: true, status: 'DRAFT' as never },
    fetchPolicy: 'cache-and-network',
  });
  const { data: chatTotalData } = useQuery(ChatSessionsTotalDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: interactionStatsData } = useQuery(MyInteractionStatsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: followingData, refetch: refetchFollowing } = useQuery(MyFollowingDocument, {
    variables: { limit: 50 },
    fetchPolicy: 'cache-and-network',
  });
  const { data: followersData, refetch: refetchFollowers } = useQuery(MyFollowersDocument, {
    variables: { limit: 50 },
    fetchPolicy: 'cache-and-network',
  });
  const [toggleFollow] = useMutation(ToggleFollowDocument);

  if (userLoading || !currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const stats = interactionStatsData?.myInteractionStats;
  const followingList = followingData?.myFollowing ?? [];
  const followersList = followersData?.myFollowers ?? [];

  const handleUnfollow = async (userId: string) => {
    await toggleFollow({
      variables: { userId },
      refetchQueries: [
        { query: MyFollowingDocument, variables: { limit: 50 } },
        { query: MyFollowersDocument, variables: { limit: 50 } },
        { query: UserProfileDocument, variables: { id: userId } },
      ],
    });
    refetchFollowing();
    refetchFollowers();
  };

  const handleFollowFromFollowers = async (userId: string) => {
    await toggleFollow({
      variables: { userId },
      refetchQueries: [
        { query: MyFollowingDocument, variables: { limit: 50 } },
        { query: MyFollowersDocument, variables: { limit: 50 } },
        { query: UserProfileDocument, variables: { id: userId } },
      ],
    });
    refetchFollowing();
    refetchFollowers();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar
            size={80}
            src={currentUser.avatarUrl}
            icon={!currentUser.avatarUrl && <UserOutlined />}
            style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={3} style={{ margin: 0 }}>
              {getDisplayName(currentUser)}
            </Title>
            <Text type="secondary">{currentUser.email}</Text>
            <div style={{ marginTop: 4 }}>
              {currentUser.roles.map(role => (
                <span
                  key={role.id}
                  style={{
                    display: 'inline-block',
                    padding: '1px 8px',
                    borderRadius: 4,
                    background: token.colorPrimaryBg,
                    color: token.colorPrimary,
                    fontSize: 12,
                    marginRight: 4,
                  }}
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
          <Button icon={<SettingOutlined />} onClick={() => navigate('/user-setting')}>
            {t('profile.editProfile')}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.stats')}
        </Title>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard
            icon={<FileTextOutlined />}
            label={t('userSetting.totalPosts')}
            value={totalData?.postsTotal ?? 0}
            color="#6366f1"
          />
          <StatCard
            icon={<CheckCircleOutlined />}
            label={t('userSetting.published')}
            value={publishedData?.postsTotal ?? 0}
            color="#34d399"
          />
          <StatCard
            icon={<EditOutlined />}
            label={t('userSetting.drafts')}
            value={draftData?.postsTotal ?? 0}
            color="#fbbf24"
          />
          <StatCard
            icon={<MessageOutlined />}
            label={t('userSetting.chatTopics')}
            value={chatTotalData?.chatSessionsTotal ?? 0}
            color="#8b5cf6"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <StatCard
            icon={<LikeOutlined />}
            label={t('userSetting.totalLikesReceived')}
            value={stats?.totalLikesReceived ?? 0}
            color="#ec4899"
          />
          <StatCard
            icon={<StarOutlined />}
            label={t('userSetting.totalBookmarks')}
            value={stats?.totalBookmarks ?? 0}
            color="#f97316"
          />
          <StatCard
            icon={<CommentOutlined />}
            label={t('userSetting.totalComments')}
            value={stats?.totalComments ?? 0}
            color="#06b6d4"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <StatCard
            icon={<HeartOutlined />}
            label={t('profile.followerCount')}
            value={followersList.length}
            color="#f43f5e"
          />
          <StatCard
            icon={<TeamOutlined />}
            label={t('profile.followingCount')}
            value={followingList.length}
            color="#3b82f6"
          />
        </div>
      </Card>

      {/* Following */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('profile.myFollowing')}
        </Title>
        {followingList.length === 0 ? (
          <Empty description={t('profile.noFollowing')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List<FollowingUser>
            dataSource={followingList}
            renderItem={(user: FollowingUser) => (
              <List.Item
                actions={[
                  <Button size="small" onClick={() => handleUnfollow(user.id)}>
                    {t('interaction.unfollow')}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={user.avatarUrl}
                      icon={!user.avatarUrl && <UserOutlined />}
                      style={{ backgroundColor: token.colorPrimary }}
                    />
                  }
                  title={<Link to={`/users/${user.id}`}>{getDisplayName(user)}</Link>}
                  description={
                    <Space size={16}>
                      <Text type="secondary">
                        {user.postCount} {t('profile.postCount')}
                      </Text>
                      <Text type="secondary">
                        {user.followerCount} {t('profile.followerCount')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Followers */}
      <Card>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('profile.myFollowers')}
        </Title>
        {followersList.length === 0 ? (
          <Empty description={t('profile.noFollowers')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List<FollowerUser>
            dataSource={followersList}
            renderItem={(user: FollowerUser) => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    type={user.isFollowing ? 'default' : 'primary'}
                    onClick={() => handleFollowFromFollowers(user.id)}
                  >
                    {user.isFollowing ? t('interaction.following') : t('interaction.follow')}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={user.avatarUrl}
                      icon={!user.avatarUrl && <UserOutlined />}
                      style={{ backgroundColor: token.colorPrimary }}
                    />
                  }
                  title={<Link to={`/users/${user.id}`}>{getDisplayName(user)}</Link>}
                  description={user.email}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
