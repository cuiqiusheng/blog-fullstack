import { theme, type ThemeConfig } from 'antd';

const BASE_TOKENS: ThemeConfig['token'] = {
  colorPrimary: '#6BAB90',
  colorLink: '#6BAB90',
  colorLinkHover: '#5a9a7e',
  colorSuccess: '#34d399',
  colorWarning: '#fbbf24',
  colorError: '#f87171',
  colorInfo: '#6BAB90',
  borderRadius: 8,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

export function getAppTheme(isDark: boolean): ThemeConfig {
  return {
    token: BASE_TOKENS,
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    components: {
      Card: {
        colorBgContainer: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
        borderRadiusLG: 12,
        boxShadowTertiary: '0 2px 12px rgba(99, 102, 241, 0.06)',
      },
      Layout: {
        bodyBg: 'transparent',
        headerBg: 'transparent',
      },
    },
  };
}
