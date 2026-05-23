import { App } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { registerGraphqlErrorNotifier } from '@/lib/graphqlErrorBridge';

/**
 * Registers Apollo ErrorLink → antd message bridge. Must render under {@link App} from antd.
 */
export function ApolloGlobalErrorNotifier() {
  const { message } = App.useApp();
  const { t } = useTranslation();

  useEffect(() => {
    return registerGraphqlErrorNotifier(text => {
      const display = text.trim() || t('common.requestFailed');
      message.error(display, 6);
    });
  }, [message, t]);

  return null;
}
