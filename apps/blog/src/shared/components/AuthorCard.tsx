import { useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Avatar, Button, Spin, Typography, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserProfileDocument, ToggleFollowDocument } from '@/graphql/codegen';
import { getDisplayName } from '@/shared/utils/displayName';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

const { Text } = Typography;

interface AuthorCardProps {
  authorId: string;
}

export function AuthorCard({ authorId }: AuthorCardProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const isSelf = currentUser?.id === authorId;

  const [fetchProfile, { data, loading }] = useLazyQuery(UserProfileDocument, {
    fetchPolicy: 'cache-and-network',
  });

  const [toggleFollow, { loading: followLoading }] = useMutation(ToggleFollowDocument, {
    refetchQueries: [{ query: UserProfileDocument, variables: { id: authorId } }],
  });

  const profile = data?.userProfile;

  useEffect(() => {
    fetchProfile({ variables: { id: authorId } });
  }, [authorId, fetchProfile]);

  if (loading && !profile) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minWidth: 220 }}>
        <Spin size="small" />
      </div>
    );
  }

  if (!profile || !profile.email) return null;

  const displayName = getDisplayName(profile as { email: string; nickname?: string | null });
  const handleToggleFollow = () => {
    toggleFollow({ variables: { userId: authorId } });
  };
  const handleViewProfile = () => {
    navigate(isSelf ? '/profile' : `/users/${authorId}`);
  };

  return (
    <div style={{ padding: 4, minWidth: 220, maxWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Avatar
          size={48}
          src={profile.avatarUrl}
          icon={!profile.avatarUrl && <UserOutlined />}
          style={{ flexShrink: 0, backgroundColor: token.colorPrimary }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{displayName}</div>
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
            {profile.email}
          </Text>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 12,
          fontSize: 13,
          color: token.colorTextSecondary,
        }}
      >
        <span>
          <strong style={{ color: token.colorText }}>{profile.followerCount}</strong>{' '}
          {t('profile.followerCount')}
        </span>
        <span>
          <strong style={{ color: token.colorText }}>{profile.followingCount}</strong>{' '}
          {t('profile.followingCount')}
        </span>
        <span>
          <strong style={{ color: token.colorText }}>{profile.postCount}</strong>{' '}
          {t('profile.postCount')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {!isSelf && (
          <Button
            type={profile.isFollowing ? 'default' : 'primary'}
            size="small"
            loading={followLoading}
            onClick={handleToggleFollow}
          >
            {profile.isFollowing ? t('interaction.following') : t('interaction.follow')}
          </Button>
        )}
        <Button size="small" onClick={handleViewProfile}>
          {t('profile.viewProfile')}
        </Button>
      </div>
    </div>
  );
}
