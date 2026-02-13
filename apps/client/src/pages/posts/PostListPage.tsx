import { useTranslation } from 'react-i18next';
import { PostListPanel } from '@/features/posts';

export function PostListPage() {
  const { t } = useTranslation();
  return <PostListPanel mode="mine" title={t('posts.myListTitle')} />;
}
