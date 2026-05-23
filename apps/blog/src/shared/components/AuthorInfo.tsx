import { Avatar, Popover, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDisplayName } from '@/shared/utils/displayName';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { AuthorCard } from './AuthorCard';

interface AuthorInfoProps {
  author: {
    id: string;
    email: string;
    nickname?: string | null;
    avatarUrl?: string | null;
  };
  showCard?: boolean;
  avatarSize?: number;
  fontSize?: number;
}

export function AuthorInfo({
  author,
  showCard = false,
  avatarSize = 20,
  fontSize = 13,
}: AuthorInfoProps) {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const isSelf = currentUser?.id === author.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(isSelf ? '/profile' : `/users/${author.id}`);
  };

  const displayName = getDisplayName(author);

  const content = (
    <span
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        gap: 6,
        cursor: 'pointer',
        fontSize,
      }}
    >
      <Avatar
        size={avatarSize}
        src={author.avatarUrl}
        icon={!author.avatarUrl && <UserOutlined />}
        style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
      />
      <span
        style={{ color: token.colorTextSecondary }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = token.colorPrimary;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = token.colorTextSecondary;
        }}
      >
        {displayName}
      </span>
    </span>
  );

  if (!showCard) return content;

  return (
    <Popover
      content={<AuthorCard authorId={author.id} />}
      trigger="hover"
      mouseEnterDelay={0.3}
      placement="bottomLeft"
      arrow={false}
    >
      {content}
    </Popover>
  );
}
