import { App, Avatar, Button, Dropdown, Menu, Space, Tag } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearToken } from '@/lib/auth';
import { setLocale, type Locale } from '@/lib/i18n';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

const NAV_ITEMS: {
  path: string;
  i18nKey: 'home' | 'posts' | 'userSetting' | 'ai' | 'reactDemos';
}[] = [
  { path: 'home', i18nKey: 'home' },
  { path: 'posts', i18nKey: 'posts' },
  { path: 'user-setting', i18nKey: 'userSetting' },
  { path: 'ai', i18nKey: 'ai' },
  { path: 'react-demos', i18nKey: 'reactDemos' },
];

function getEmailPrefix(email: string): string {
  return email.split('@')[0];
}

export function Nav() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { currentUser } = useCurrentUser();
  const current = pathname.split('/').filter(Boolean)[0] ?? 'home';

  const navItems = NAV_ITEMS.map(({ path, i18nKey }) => ({
    key: path,
    label: <Link to={`/${path}`}>{t(`nav.${i18nKey}`)}</Link>,
  }));

  const handleLogout = () => {
    modal.confirm({
      title: t('common.logoutConfirmTitle'),
      okText: t('common.ok'),
      cancelText: t('common.cancel'),
      onOk() {
        clearToken();
        navigate('/login', { replace: true });
      },
    });
  };

  const langMenuItems = [
    { key: 'zh-CN', label: '中文' },
    { key: 'en', label: 'English' },
  ];

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>{currentUser?.email}</div>
          {currentUser?.roles && currentUser.roles.length > 0 && (
            <Space size={4} style={{ marginTop: 4 }}>
              {currentUser.roles.map(role => (
                <Tag key={role.id} color="blue" style={{ margin: 0 }}>
                  {role.name}
                </Tag>
              ))}
            </Space>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'user-setting',
      label: t('nav.userSetting'),
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

  const displayName = currentUser ? getEmailPrefix(currentUser.email) : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Menu
        mode="horizontal"
        selectedKeys={[current]}
        items={navItems}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Button type="primary" onClick={() => navigate('/posts/new')} style={{ marginRight: 8 }}>
        {t('nav.write')}
      </Button>
      <Dropdown
        menu={{
          items: langMenuItems,
          selectedKeys: [i18n.language],
          onClick: ({ key }) => {
            setLocale(key as Locale);
          },
        }}
        trigger={['click']}
      >
        <Button type="text" style={{ marginRight: 8 }}>
          {i18n.language === 'zh-CN' ? '中文' : 'EN'}
        </Button>
      </Dropdown>
      <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
        <Space style={{ cursor: 'pointer', marginLeft: 4 }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span
            style={{
              fontSize: 14,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
        </Space>
      </Dropdown>
    </div>
  );
}
