import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PostListPanel } from '@/features/posts';

export function PostListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate('/posts/new')}>
          {t('nav.write')}
        </Button>
      </div>
      <PostListPanel mode="mine" title={t('posts.myListTitle')} />
    </>
  );
}
