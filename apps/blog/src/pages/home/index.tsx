import { useTranslation } from 'react-i18next';
import { PostListPanel } from '@/features/posts';

export function HomePage() {
  const { t } = useTranslation();
  return <PostListPanel mode="all" title={t('posts.allListTitle')} />;
}
