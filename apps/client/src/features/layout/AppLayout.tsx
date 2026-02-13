import { Layout } from 'antd';
import { Nav } from './Nav';

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
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
