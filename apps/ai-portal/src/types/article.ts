export interface ArticleSource {
  id: number;
  name: string;
  kind: string;
}

export interface Article {
  id: number;
  title: string;
  summary: string | null;
  status: 'draft' | 'published' | 'archived' | string;
  url: string | null;
  category: string | null;
  quality_score: number | null;
  source: ArticleSource | null;
  published_at: string | null;
  created_at: string;
  body?: string | null; // 详情接口会返回
}

export interface ArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  page_size: number;
}
