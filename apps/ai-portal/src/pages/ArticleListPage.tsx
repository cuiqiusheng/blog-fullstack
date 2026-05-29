import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import { fetchArticles } from '../lib/api';
import type { Article } from '../types/article';

export default function ArticleListPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArticles({ page: 1, pageSize: 20 });
        if (!cancelled) setItems(data.items);
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
  }, []);

  if (loading) return <main style={{ padding: 24 }}>加载中...</main>;
  if (error) return <main style={{ padding: 24 }}>加载失败：{error}</main>;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <h1>AI 专栏</h1>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 24 }}>
        {items.map(article => (
          <li
            key={article.id}
            style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 12 }}
          >
            <h3 style={{ margin: '0 0 8px' }}>
              <Link to={`/articles/${article.id}`}>{article.title}</Link>
            </h3>
            <MarkdownRenderer content={article.summary ?? ''} />
          </li>
        ))}
      </ul>
    </main>
  );
}
