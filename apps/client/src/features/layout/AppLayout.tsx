import { Layout } from 'antd';
import { Nav } from './Nav';
import { useThemeMode } from '@/shared/hooks/themeMode';
import { useMobile } from '@/shared/hooks';

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isDark } = useThemeMode();
  const isMobile = useMobile();

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 12px' : '0 24px',
          background: isDark
            ? 'rgba(15, 20, 18, 0.78)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(107,171,144,0.08) 100%)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          borderBottom: isDark
            ? '1px solid rgba(107, 171, 144, 0.15)'
            : '1px solid rgba(107, 171, 144, 0.18)',
          boxShadow: isDark ? '0 1px 8px rgba(0, 0, 0, 0.3)' : '0 1px 8px rgba(107, 171, 144, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Nav />
      </Header>
      <Content style={{ padding: isMobile ? 12 : 24 }}>{children}</Content>
    </Layout>
  );
}
