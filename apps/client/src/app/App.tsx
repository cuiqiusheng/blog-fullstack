import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { AppRoutes } from './routes';
import { appTheme } from './theme';

const antdLocales: Record<string, typeof zhCN> = {
  'zh-CN': zhCN,
  en: enUS,
};

export function App() {
  const { i18n } = useTranslation();
  const locale = antdLocales[i18n.language] ?? zhCN;

  return (
    <ConfigProvider theme={appTheme} locale={locale}>
      <AntdApp>
        <AppRoutes />
      </AntdApp>
    </ConfigProvider>
  );
}
