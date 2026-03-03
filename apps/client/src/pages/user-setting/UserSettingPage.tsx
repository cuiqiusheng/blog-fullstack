import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import {
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Radio,
  Space,
  Spin,
  Switch,
  Typography,
  Upload,
} from 'antd';
import { UserOutlined, CameraOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MeDocument, UpdateProfileDocument, ChangePasswordDocument } from '@/graphql/codegen';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useThemeMode } from '@/shared/hooks/themeMode';
import { setLocale, type Locale } from '@/lib/i18n';
import { uploadImage } from '@/lib/upload';

const { Title, Text } = Typography;

export function UserSettingPage() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const { currentUser, loading: userLoading } = useCurrentUser();
  const { mode, setMode } = useThemeMode();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const avatarUrlValue = Form.useWatch('avatarUrl', profileForm);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [updateProfile, { loading: profileSaving }] = useMutation(UpdateProfileDocument, {
    refetchQueries: [{ query: MeDocument }],
    onCompleted: () => message.success(t('userSetting.profileSaved')),
    onError: () => message.error(t('userSetting.profileSaveFailed')),
  });

  const [changePassword, { loading: passwordSaving }] = useMutation(ChangePasswordDocument, {
    onCompleted: () => {
      message.success(t('userSetting.passwordChanged'));
      passwordForm.resetFields();
    },
    onError: () => message.error(t('userSetting.passwordChangeFailed')),
  });

  if (userLoading || !currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleProfileSave = (values: { nickname?: string; avatarUrl?: string }) => {
    updateProfile({ variables: { nickname: values.nickname, avatarUrl: values.avatarUrl } });
  };

  const handlePasswordChange = (values: { currentPassword: string; newPassword: string }) => {
    changePassword({
      variables: { currentPassword: values.currentPassword, newPassword: values.newPassword },
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {t('userSetting.pageTitle')}
        </Title>
        <Link to="/profile">
          <Button type="link">{t('profile.viewMyProfile')}</Button>
        </Link>
      </div>

      {/* Profile */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.profile')}
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {t('userSetting.email')}: {currentUser.email}
        </Text>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            nickname: currentUser.nickname ?? '',
            avatarUrl: currentUser.avatarUrl ?? '',
          }}
          onFinish={handleProfileSave}
          style={{ maxWidth: 480 }}
        >
          <Form.Item label={t('userSetting.avatarUrl')}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space align="center" size={16}>
                <Upload
                  showUploadList={false}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  beforeUpload={async file => {
                    setAvatarUploading(true);
                    try {
                      const url = await uploadImage(file);
                      profileForm.setFieldValue('avatarUrl', url);
                      await updateProfile({
                        variables: {
                          nickname: profileForm.getFieldValue('nickname'),
                          avatarUrl: url,
                        },
                      });
                    } catch (err) {
                      message.error(
                        err instanceof Error ? err.message : t('userSetting.avatarUploadFailed'),
                      );
                    } finally {
                      setAvatarUploading(false);
                    }
                    return false;
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                  >
                    <Avatar size={64} src={avatarUrlValue || undefined} icon={<UserOutlined />} />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: avatarUploading ? 1 : 0,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.opacity = '1';
                      }}
                      onMouseLeave={e => {
                        if (!avatarUploading)
                          (e.currentTarget as HTMLDivElement).style.opacity = '0';
                      }}
                    >
                      {avatarUploading ? (
                        <Spin size="small" />
                      ) : (
                        <CameraOutlined style={{ color: '#fff', fontSize: 20 }} />
                      )}
                    </div>
                  </div>
                </Upload>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('userSetting.avatarHint')}
                  </Text>
                  <br />
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    style={{ paddingLeft: 0 }}
                    onClick={() => setShowUrlInput(v => !v)}
                  >
                    {showUrlInput ? t('userSetting.hideUrlInput') : t('userSetting.useUrlInput')}
                  </Button>
                </div>
              </Space>
              {showUrlInput && (
                <Form.Item name="avatarUrl" noStyle>
                  <Input placeholder={t('userSetting.avatarUrlPlaceholder')} />
                </Form.Item>
              )}
              <Form.Item name="avatarUrl" hidden>
                <Input />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="nickname" label={t('userSetting.nickname')}>
            <Input placeholder={t('userSetting.nicknamePlaceholder')} maxLength={32} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={profileSaving}>
              {t('userSetting.saveProfile')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Change Password */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.changePassword')}
        </Title>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          style={{ maxWidth: 480 }}
        >
          <Form.Item
            name="currentPassword"
            label={t('userSetting.currentPassword')}
            rules={[{ required: true, message: t('userSetting.currentPasswordRequired') }]}
          >
            <Input.Password placeholder={t('userSetting.currentPasswordPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('userSetting.newPassword')}
            rules={[
              { required: true, message: t('userSetting.newPasswordRequired') },
              { min: 6, message: t('userSetting.newPasswordMinLength') },
            ]}
          >
            <Input.Password placeholder={t('userSetting.newPasswordPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label={t('userSetting.confirmNewPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('userSetting.confirmNewPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error(t('userSetting.confirmNewPasswordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('userSetting.confirmNewPasswordPlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordSaving}>
              {t('userSetting.submitPassword')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Appearance */}
      <Card>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.appearance')}
        </Title>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 480,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('userSetting.darkMode')}</span>
            <Switch
              checked={mode === 'dark'}
              onChange={checked => setMode(checked ? 'dark' : 'light')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('userSetting.language')}</span>
            <Radio.Group
              value={i18n.language}
              onChange={e => setLocale(e.target.value as Locale)}
              optionType="button"
              size="small"
            >
              <Radio.Button value="zh-CN">中文</Radio.Button>
              <Radio.Button value="en">English</Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </Card>
    </div>
  );
}
