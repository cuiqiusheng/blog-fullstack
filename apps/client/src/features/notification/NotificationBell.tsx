import { useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client/react';
import { Badge, Button, Drawer, Empty, List, Popover, Space, Typography } from 'antd';
import {
  BellOutlined,
  LikeOutlined,
  MessageOutlined,
  CheckOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  NotificationsDocument,
  UnreadNotificationCountDocument,
  MarkNotificationReadDocument,
  MarkAllNotificationsReadDocument,
  NotificationReceivedDocument,
  NotificationType,
} from '@/graphql/codegen';
import { useMobile } from '@/shared/hooks';
import { getDisplayName } from '@/shared/utils/displayName';
import { getNotificationI18nKey, truncateContent } from './notificationUtils';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  [NotificationType.Like]: <LikeOutlined style={{ color: '#1677ff' }} />,
  [NotificationType.Comment]: <MessageOutlined style={{ color: '#52c41a' }} />,
  [NotificationType.Reply]: <MessageOutlined style={{ color: '#faad14' }} />,
  [NotificationType.Follow]: <UserAddOutlined style={{ color: '#f43f5e' }} />,
};

export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);

  const { data: countData, refetch: refetchCount } = useQuery(UnreadNotificationCountDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const {
    data: listData,
    loading,
    refetch: refetchList,
  } = useQuery(NotificationsDocument, {
    variables: { limit: 20 },
    fetchPolicy: 'cache-and-network',
  });

  const [markRead] = useMutation(MarkNotificationReadDocument);
  const [markAllRead] = useMutation(MarkAllNotificationsReadDocument);

  useSubscription(NotificationReceivedDocument, {
    onData: () => {
      refetchCount();
      refetchList();
    },
  });

  const unreadCount = countData?.unreadNotificationCount ?? 0;
  const notifications = listData?.notifications ?? [];

  const handleClickItem = async (
    id: string,
    read: boolean,
    type: NotificationType,
    actorId: string,
    postId?: string | null,
    commentId?: string | null,
  ) => {
    if (!read) {
      await markRead({ variables: { id } });
      refetchCount();
      refetchList();
    }
    setOpen(false);
    if (type === NotificationType.Follow) {
      navigate(`/users/${actorId}`);
      return;
    }
    if (postId) {
      const search = commentId ? `?commentId=${commentId}` : '';
      navigate(`/posts/${postId}${search}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    refetchCount();
    refetchList();
  };

  const locale = i18n.language === 'zh-CN' ? 'zh-cn' : 'en';

  const markAllReadButton = unreadCount > 0 && (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px 8px' }}>
      <Button type="link" size="small" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
        {t('notification.markAllRead')}
      </Button>
    </div>
  );

  const notificationList = (
    <List
      loading={loading}
      dataSource={notifications}
      locale={{ emptyText: <Empty description={t('notification.empty')} /> }}
      renderItem={item => {
        const actorName = getDisplayName(item.actor);
        const preview = truncateContent(item.commentContent);
        return (
          <List.Item
            style={{
              cursor: 'pointer',
              padding: '8px 4px',
              background: item.read ? 'transparent' : 'rgba(22, 119, 255, 0.04)',
            }}
            onClick={() =>
              handleClickItem(
                item.id,
                item.read,
                item.type,
                item.actor.id,
                item.postId,
                item.commentId,
              )
            }
          >
            <Space align="start" size={8}>
              {NOTIFICATION_ICON[item.type]}
              <div style={{ minWidth: 0 }}>
                <Text style={{ fontWeight: item.read ? 400 : 500 }}>
                  {t(getNotificationI18nKey(item.type, item.postTitle), {
                    name: actorName,
                    postTitle: item.postTitle ?? '',
                  })}
                </Text>
                {preview && (
                  <div style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {preview}
                    </Text>
                  </div>
                )}
                <div style={{ marginTop: 2 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.createdAt).locale(locale).fromNow()}
                  </Text>
                </div>
              </div>
            </Space>
          </List.Item>
        );
      }}
    />
  );

  const bellButton = (
    <Badge count={unreadCount} size="small" offset={[-4, 4]}>
      <Button
        type="text"
        icon={<BellOutlined />}
        onClick={isMobile ? () => setOpen(true) : undefined}
        style={{ marginRight: 4 }}
      />
    </Badge>
  );

  if (isMobile) {
    return (
      <>
        {bellButton}
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          placement="bottom"
          height="70vh"
          title={t('notification.title')}
        >
          {markAllReadButton}
          {notificationList}
        </Drawer>
      </>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <div style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
          {markAllReadButton}
          {notificationList}
        </div>
      }
      title={t('notification.title')}
      trigger="click"
      placement="bottomRight"
    >
      {bellButton}
    </Popover>
  );
}
