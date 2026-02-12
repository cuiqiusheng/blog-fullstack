import { App, Button, Dropdown, Menu } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearToken } from '@/lib/auth';
import { setLocale, type Locale } from '@/lib/i18n';

const NAV_ITEMS: { path: string; i18nKey: 'home' | 'posts' | 'userSetting' | 'ai' }[] = [
  { path: 'home', i18nKey: 'home' },
  { path: 'posts', i18nKey: 'posts' },
  { path: 'user-setting', i18nKey: 'userSetting' },
  { path: 'ai', i18nKey: 'ai' },
];

export function Nav() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const current = pathname.slice(1) || 'home';

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Menu
        mode="horizontal"
        selectedKeys={[current]}
        items={navItems}
        style={{ flex: 1, minWidth: 0 }}
      />
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
      <Button type="text" onClick={handleLogout}>
        {t('common.logout')}
      </Button>
    </div>
  );
}
