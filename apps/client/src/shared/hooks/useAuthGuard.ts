import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';

export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { t } = useTranslation();

  const guard = (action: () => void) => {
    if (isAuthenticated) {
      action();
      return;
    }
    modal.confirm({
      title: t('auth.loginRequired'),
      content: t('auth.loginRequiredDesc'),
      okText: t('auth.goLogin'),
      cancelText: t('common.cancel'),
      onOk: () => navigate('/login'),
    });
  };

  return { guard, isAuthenticated };
}
