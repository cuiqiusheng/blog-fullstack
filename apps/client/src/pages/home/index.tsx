import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

export function HomePage() {
  const { t } = useTranslation();
  return (
    <div style={{ marginTop: 0 }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        {t('home.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t('home.welcome')}
      </Paragraph>
    </div>
  );
}
