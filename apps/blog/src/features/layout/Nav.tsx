import { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { App, Avatar, Button, Drawer, Dropdown, Menu, Space, Tag } from 'antd';
import {
  EditOutlined,
  GithubOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearToken } from '@/lib/auth';
import { setLocale, type Locale } from '@/lib/i18n';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useMobile } from '@/shared/hooks';
import { getDisplayName } from '@/shared/utils/displayName';
import { NotificationBell } from '@/features/notification';
import './nav.css';

type NavItemKey = 'explore' | 'myPosts' | 'bookmarks' | 'profile' | 'userSetting' | 'ai';

const ALL_NAV_ITEMS: { path: string; i18nKey: NavItemKey; authRequired: boolean }[] = [
  { path: 'posts', i18nKey: 'myPosts', authRequired: true },
  { path: 'explore', i18nKey: 'explore', authRequired: false },
  { path: 'bookmarks', i18nKey: 'bookmarks', authRequired: true },
  { path: 'profile', i18nKey: 'profile', authRequired: true },
  { path: 'user-setting', i18nKey: 'userSetting', authRequired: true },
  { path: 'ai', i18nKey: 'ai', authRequired: true },
];

const ICON_BTN_STYLE: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
};

const DIVIDER_STYLE: React.CSSProperties = {
  width: 1,
  height: 20,
  background: 'rgba(107, 171, 144, 0.2)',
  margin: '0 6px',
  flexShrink: 0,
};

export function Nav() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const apolloClient = useApolloClient();
  const { isAuthenticated } = useAuth();
  const { guard } = useAuthGuard();
  const { currentUser } = useCurrentUser();
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = pathname.split('/').filter(Boolean)[0] ?? 'explore';
  const displayName = currentUser ? getDisplayName(currentUser) : '';
  const langLabel = i18n.language === 'zh-CN' ? '中文' : 'English';

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = () => {
    closeDrawer();
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

  const langMenuItems = [
    { key: 'zh-CN', label: '🇨🇳  中文' },
    { key: 'en', label: '🇺🇸  English' },
  ];
  const handleLangSwitch = ({ key }: { key: string }) => setLocale(key as Locale);

  const desktopNavItems = ALL_NAV_ITEMS.map(({ path, i18nKey, authRequired }) => ({
    key: path,
    label:
      authRequired && !isAuthenticated ? (
        <a onClick={() => guard(() => navigate(`/${path}`))}>{t(`nav.${i18nKey}`)}</a>
      ) : (
        <Link to={`/${path}`}>{t(`nav.${i18nKey}`)}</Link>
      ),
  }));

  const drawerNavItems = ALL_NAV_ITEMS.map(({ path, i18nKey, authRequired }) => ({
    key: path,
    label: t(`nav.${i18nKey}`),
    onClick: () => {
      if (authRequired && !isAuthenticated) {
        guard(() => navigate(`/${path}`));
      } else {
        navigate(`/${path}`);
      }
      closeDrawer();
    },
  }));

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0', cursor: 'default' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{displayName}</div>
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

  const userAvatar = (
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
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {isMobile ? (
        <>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            style={ICON_BTN_STYLE}
          />
          <div style={{ flex: 1 }} />
          <Space size={4} align="center">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => guard(() => navigate('/posts/new'))}
            />
            {isAuthenticated ? (
              <>
                <NotificationBell />
                {userAvatar}
              </>
            ) : (
              <Button type="primary" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
            )}
          </Space>
        </>
      ) : (
        <>
          <Menu
            mode="horizontal"
            selectedKeys={[current]}
            items={desktopNavItems}
            style={{ flex: 1, minWidth: 0, background: 'transparent', borderBottom: 'none' }}
          />
          <Space size={4} align="center" style={{ flexShrink: 0 }}>
            <Button
              type="primary"
              onClick={() => guard(() => navigate('/posts/new'))}
              style={{ borderRadius: 20 }}
            >
              {t('nav.write')}
            </Button>
            <span style={DIVIDER_STYLE} />
            <Dropdown
              menu={{
                items: langMenuItems,
                selectedKeys: [i18n.language],
                onClick: handleLangSwitch,
              }}
              trigger={['click']}
            >
              <Button
                type="text"
                icon={<GlobalOutlined />}
                style={ICON_BTN_STYLE}
                title={langLabel}
              />
            </Dropdown>
            <Button
              type="text"
              icon={<GithubOutlined />}
              href="https://github.com/cuiqiusheng/blog-fullstack"
              target="_blank"
              rel="noopener noreferrer"
              style={ICON_BTN_STYLE}
              title="GitHub"
            />
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <span style={DIVIDER_STYLE} />
                {userAvatar}
              </>
            ) : (
              <>
                <span style={DIVIDER_STYLE} />
                <Button type="primary" onClick={() => navigate('/login')}>
                  {t('nav.login')}
                </Button>
                <Button onClick={() => navigate('/register')}>{t('nav.register')}</Button>
              </>
            )}
          </Space>
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        placement="left"
        width={280}
        styles={{ body: { padding: 0 } }}
        title="Sans Blog"
        className="nav-mobile-drawer"
      >
        <Menu
          mode="vertical"
          selectedKeys={[current]}
          items={drawerNavItems}
          style={{ borderInlineEnd: 'none' }}
        />
        <div className="nav-drawer-extra">
          <Dropdown
            menu={{
              items: langMenuItems,
              selectedKeys: [i18n.language],
              onClick: handleLangSwitch,
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<GlobalOutlined />} block style={{ textAlign: 'left' }}>
              {langLabel}
            </Button>
          </Dropdown>
          <Button
            type="text"
            icon={<GithubOutlined />}
            href="https://github.com/cuiqiusheng/blog-fullstack"
            target="_blank"
            rel="noopener noreferrer"
            block
            style={{ textAlign: 'left' }}
          >
            GitHub
          </Button>
          {!isAuthenticated && (
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                block
                onClick={() => {
                  navigate('/login');
                  closeDrawer();
                }}
              >
                {t('nav.login')}
              </Button>
              <Button
                block
                style={{ marginTop: 8 }}
                onClick={() => {
                  navigate('/register');
                  closeDrawer();
                }}
              >
                {t('nav.register')}
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
