import { useMutation, useQuery } from '@apollo/client/react';
import {
  App,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Radio,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  theme,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  MessageOutlined,
  LikeOutlined,
  StarOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  MeDocument,
  UpdateProfileDocument,
  ChangePasswordDocument,
  PostsTotalDocument,
  ChatSessionsTotalDocument,
  MyInteractionStatsDocument,
} from '@/graphql/codegen';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useThemeMode } from '@/shared/hooks/themeMode';
import { setLocale, type Locale } from '@/lib/i18n';
import type { ReactNode } from 'react';

const { Title } = Typography;

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainerDisabled,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: token.borderRadiusLG,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: token.colorTextSecondary, whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function UserSettingPage() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const { currentUser, loading: userLoading } = useCurrentUser();
  const { mode, setMode } = useThemeMode();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const avatarUrlValue = Form.useWatch('avatarUrl', profileForm);

  const { data: totalData } = useQuery(PostsTotalDocument, {
    variables: { mine: true },
    fetchPolicy: 'cache-and-network',
  });
  const { data: publishedData } = useQuery(PostsTotalDocument, {
    variables: { mine: true, status: 'PUBLISHED' as never },
    fetchPolicy: 'cache-and-network',
  });
  const { data: draftData } = useQuery(PostsTotalDocument, {
    variables: { mine: true, status: 'DRAFT' as never },
    fetchPolicy: 'cache-and-network',
  });
  const { data: chatTotalData } = useQuery(ChatSessionsTotalDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: interactionStatsData } = useQuery(MyInteractionStatsDocument, {
    fetchPolicy: 'cache-and-network',
  });

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

  const registeredAt = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString()
    : '-';

  const stats = interactionStatsData?.myInteractionStats;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        {t('userSetting.pageTitle')}
      </Title>

      {/* Account Info */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.accountInfo')}
        </Title>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('userSetting.email')}>{currentUser.email}</Descriptions.Item>
          <Descriptions.Item label={t('userSetting.roles')}>
            {currentUser.roles.length > 0 ? (
              <Space size={4}>
                {currentUser.roles.map(role => (
                  <Tag key={role.id} color="blue">
                    {role.name}
                  </Tag>
                ))}
              </Space>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('userSetting.registeredAt')}>
            {registeredAt}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Stats */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.stats')}
        </Title>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard
            icon={<FileTextOutlined />}
            label={t('userSetting.totalPosts')}
            value={totalData?.postsTotal ?? 0}
            color="#1677ff"
          />
          <StatCard
            icon={<CheckCircleOutlined />}
            label={t('userSetting.published')}
            value={publishedData?.postsTotal ?? 0}
            color="#52c41a"
          />
          <StatCard
            icon={<EditOutlined />}
            label={t('userSetting.drafts')}
            value={draftData?.postsTotal ?? 0}
            color="#faad14"
          />
          <StatCard
            icon={<MessageOutlined />}
            label={t('userSetting.chatTopics')}
            value={chatTotalData?.chatSessionsTotal ?? 0}
            color="#722ed1"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <StatCard
            icon={<LikeOutlined />}
            label={t('userSetting.totalLikesReceived')}
            value={stats?.totalLikesReceived ?? 0}
            color="#eb2f96"
          />
          <StatCard
            icon={<StarOutlined />}
            label={t('userSetting.totalBookmarks')}
            value={stats?.totalBookmarks ?? 0}
            color="#fa8c16"
          />
          <StatCard
            icon={<CommentOutlined />}
            label={t('userSetting.totalComments')}
            value={stats?.totalComments ?? 0}
            color="#13c2c2"
          />
        </div>
      </Card>

      {/* Profile */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          {t('userSetting.profile')}
        </Title>
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
          <Form.Item
            name="avatarUrl"
            label={
              <Space>
                {t('userSetting.avatarUrl')}
                <Avatar size={32} src={avatarUrlValue || undefined} icon={<UserOutlined />} />
              </Space>
            }
          >
            <Input placeholder={t('userSetting.avatarUrlPlaceholder')} />
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
