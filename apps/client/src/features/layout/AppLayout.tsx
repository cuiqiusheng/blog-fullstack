import { Layout } from 'antd';
import { Nav } from './Nav';
import { useThemeMode } from '@/shared/hooks/themeMode';

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isDark } = useThemeMode();

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: isDark ? 'rgba(15, 15, 25, 0.72)' : 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(16px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Nav />
      </Header>
      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}
