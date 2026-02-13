import { useMutation } from '@apollo/client/react';
import { Form, Input, Button, Card, Alert, Typography, Dropdown } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginDocument, type LoginMutation } from '@/graphql/__generated__';
import { setToken } from '@/lib/auth';
import { setLocale, type Locale } from '@/lib/i18n';
import './auth.css';

const { Title, Text } = Typography;

const langItems = [
  { key: 'zh-CN', label: '中文' },
  { key: 'en', label: 'English' },
];

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [login, { loading, error }] = useMutation(LoginDocument, {
    onCompleted: (data: LoginMutation) => {
      if (data?.login?.token) {
        setToken(data.login.token);
        form.resetFields();
        navigate('/home', { replace: true });
      }
    },
  });

  const onFinish = (values: { email: string; password: string }) => {
    login({ variables: { email: values.email, password: values.password } });
  };

  return (
    <div className="auth-page">
      <div className="auth-page__lang">
        <Dropdown
          menu={{
            items: langItems,
            selectedKeys: [i18n.language],
            onClick: ({ key }) => setLocale(key as Locale),
          }}
          trigger={['click']}
        >
          <Button
            type="default"
            style={{
              minWidth: 96,
              padding: '6px 16px',
              fontSize: 14,
              fontWeight: 500,
              borderColor: 'rgba(107, 171, 144, 0.5)',
              color: 'rgba(0, 0, 0, 0.85)',
            }}
          >
            {i18n.language === 'zh-CN' ? '中文' : 'EN'} ▾
          </Button>
        </Dropdown>
      </div>
      <div className="auth-page__center">
        <Card style={{ width: '100%', maxWidth: 400 }} className="auth-page__card" bordered={false}>
          <Title level={3} style={{ marginBottom: 8 }}>
            {t('auth.login.title')}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            {t('auth.login.subtitle')}
          </Text>
          {error && (
            <Alert type="error" message={error.message} showIcon style={{ marginBottom: 16 }} />
          )}
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="email"
              label={t('auth.login.email')}
              rules={[
                { required: true, message: t('auth.login.emailRequired') },
                { type: 'email', message: t('auth.login.emailInvalid') },
              ]}
            >
              <Input
                placeholder={t('auth.login.emailPlaceholder')}
                size="large"
                autoComplete="email"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('auth.login.password')}
              rules={[{ required: true, message: t('auth.login.passwordRequired') }]}
            >
              <Input.Password
                placeholder={t('auth.login.passwordPlaceholder')}
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                {t('auth.login.submit')}
              </Button>
            </Form.Item>
          </Form>
          <div className="auth-page__footer">
            {t('auth.noAccount')}
            <Link to="/register">{t('auth.goToRegister')}</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
