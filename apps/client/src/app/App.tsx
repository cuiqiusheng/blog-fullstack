import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { AppRoutes } from './routes';
import { appTheme } from './theme';
import { ThemeModeProvider, useThemeMode } from '@/shared/hooks/themeMode';

const antdLocales: Record<string, typeof zhCN> = {
  'zh-CN': zhCN,
  en: enUS,
};

function AppInner() {
  const { i18n } = useTranslation();
  const locale = antdLocales[i18n.language] ?? zhCN;
  const { isDark } = useThemeMode();

  const mergedTheme = {
    ...appTheme,
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <ConfigProvider theme={mergedTheme} locale={locale}>
      <AntdApp>
        <AppRoutes />
      </AntdApp>
    </ConfigProvider>
  );
}

export function App() {
  return (
    <ThemeModeProvider>
      <AppInner />
    </ThemeModeProvider>
  );
}
