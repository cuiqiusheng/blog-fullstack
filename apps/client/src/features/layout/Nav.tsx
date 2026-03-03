import { useApolloClient } from '@apollo/client/react';
import { App, Avatar, Button, Dropdown, Menu, Space, Tag } from 'antd';
import {
  GithubOutlined,
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearToken } from '@/lib/auth';
import { setLocale, type Locale } from '@/lib/i18n';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { getDisplayName } from '@/shared/utils/displayName';
import { NotificationBell } from '@/features/notification';
import './nav.css';

const NAV_ITEMS: {
  path: string;
  i18nKey: 'explore' | 'myPosts' | 'bookmarks' | 'profile' | 'userSetting' | 'ai';
}[] = [
  { path: 'posts', i18nKey: 'myPosts' },
  { path: 'explore', i18nKey: 'explore' },
  { path: 'bookmarks', i18nKey: 'bookmarks' },
  { path: 'profile', i18nKey: 'profile' },
  { path: 'user-setting', i18nKey: 'userSetting' },
  { path: 'ai', i18nKey: 'ai' },
];

export function Nav() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const apolloClient = useApolloClient();
  const { currentUser } = useCurrentUser();
  const current = pathname.split('/').filter(Boolean)[0] ?? 'posts';

  const navItems = NAV_ITEMS.map(({ path, i18nKey }) => ({
    key: path,
    label: <Link to={`/${path}`}>{t(`nav.${i18nKey}`)}</Link>,
  }));

  const handleLogout = () => {
    modal.confirm({
      title: t('common.logoutConfirmTitle'),
      okText: t('common.ok'),
      cancelText: t('common.cancel'),
      async onOk() {
        clearToken();
        await apolloClient.clearStore();
        navigate('/login', { replace: true });
      },
    });
  };

  const langLabel = i18n.language === 'zh-CN' ? '中文' : 'English';
  const langMenuItems = [
    { key: 'zh-CN', label: '🇨🇳  中文' },
    { key: 'en', label: '🇺🇸  English' },
  ];

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0', cursor: 'default' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {currentUser ? getDisplayName(currentUser) : ''}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{currentUser?.email}</div>
          {currentUser?.roles && currentUser.roles.length > 0 && (
            <Space size={4} style={{ marginTop: 6 }}>
              {currentUser.roles.map(role => (
                <Tag key={role.id} color="green" style={{ margin: 0 }}>
                  {role.name}
                </Tag>
              ))}
            </Space>
          )}
        </div>
      ),
      className: 'nav-user-info-item',
    },
    { type: 'divider' as const },
    {
      key: 'user-setting',
      label: t('nav.userSetting'),
      icon: <SettingOutlined />,
      onClick: () => navigate('/user-setting'),
    },
    {
      key: 'logout',
      label: t('common.logout'),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const displayName = currentUser ? getDisplayName(currentUser) : '';

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  };

  const dividerStyle: React.CSSProperties = {
    width: 1,
    height: 20,
    background: 'rgba(107, 171, 144, 0.2)',
    margin: '0 6px',
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Menu
        mode="horizontal"
        selectedKeys={[current]}
        items={navItems}
        style={{ flex: 1, minWidth: 0, background: 'transparent', borderBottom: 'none' }}
      />

      <Space size={4} align="center" style={{ flexShrink: 0 }}>
        <Button type="primary" onClick={() => navigate('/posts/new')} style={{ borderRadius: 20 }}>
          {t('nav.write')}
        </Button>

        <span style={dividerStyle} />

        <Dropdown
          menu={{
            items: langMenuItems,
            selectedKeys: [i18n.language],
            onClick: ({ key }) => setLocale(key as Locale),
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<GlobalOutlined />} style={iconBtnStyle} title={langLabel} />
        </Dropdown>
        <Button
          type="text"
          icon={<GithubOutlined />}
          href="https://github.com/cuiqiusheng/blog-fullstack"
          target="_blank"
          rel="noopener noreferrer"
          style={iconBtnStyle}
          title="GitHub"
        />
        <NotificationBell />

        <span style={dividerStyle} />

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <span className="nav-user-trigger" title={displayName}>
            <Avatar
              size={32}
              src={currentUser?.avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ border: '2px solid rgba(107, 171, 144, 0.3)' }}
            />
          </span>
        </Dropdown>
      </Space>
    </div>
  );
}
