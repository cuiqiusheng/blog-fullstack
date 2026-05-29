import type { Article, ArticleListResponse } from '../types/article';

const API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL ?? '/ai-api';

async function requestJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchArticles(params?: { page?: number; pageSize?: number; status?: string }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const status = params?.status ?? 'published';

  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (status) qs.set('status', status);

  return requestJson<ArticleListResponse>(`/articles?${qs.toString()}`);
}

export function fetchArticleById(id: number) {
  return requestJson<Article>(`/articles/${id}`);
}
