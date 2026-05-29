import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchArticleById } from '../lib/api';
import type { Article } from '../types/article';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const articleId = Number(id);
  const isInvalidArticleId = !articleId || Number.isNaN(articleId);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInvalidArticleId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArticleById(articleId);
        if (!cancelled) setArticle(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [articleId, isInvalidArticleId]);

  if (isInvalidArticleId) return <main style={{ padding: 24 }}>加载失败：无效文章 ID</main>;
  if (loading) return <main style={{ padding: 24 }}>加载中...</main>;
  if (error) return <main style={{ padding: 24 }}>加载失败：{error}</main>;
  if (!article) return <main style={{ padding: 24 }}>文章不存在</main>;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <p>
        <Link to="/">← 返回列表</Link>
      </p>
      <h1>{article.title}</h1>
      <MarkdownRenderer content={article.summary ?? '暂无摘要'} />
      <MarkdownRenderer content={article.body ?? '暂无正文'} />
    </main>
  );
}
