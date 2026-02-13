import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { PostListPanel } from '@/features/posts';

const { Title, Paragraph } = Typography;

export function HomePage() {
  const { t } = useTranslation();
  return (
    <div style={{ marginTop: 0 }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        {t('home.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {t('home.welcome')}
      </Paragraph>
      <PostListPanel mode="all" title={t('posts.allListTitle')} />
    </div>
  );
}
