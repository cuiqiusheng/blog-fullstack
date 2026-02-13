import { createHash } from 'crypto';

export interface RawGeneratedArticle {
  title?: string;
  content?: string;
}

export interface ValidatedArticle {
  title: string;
  content: string;
  wordCount: number;
  contentHash: string;
}

export interface ValidationOptions {
  minWords: number;
  maxWords: number;
}

function removeCodeFence(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractJsonSegment(value: string): string | null {
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if (first === -1 || last === -1 || first >= last) {
    return null;
  }
  return value.slice(first, last + 1);
}

function fallbackExtractArticle(value: string): RawGeneratedArticle {
  const lines = value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const titleCandidate = lines[0]?.replace(/^#+\s*/, '').replace(/^标题[:：]\s*/, '') ?? '';
  return {
    title: titleCandidate,
    content: value.trim(),
  };
}

export function parseArticleFromModelOutput(output: string): RawGeneratedArticle {
  const cleaned = removeCodeFence(output);
  const candidates = [cleaned, extractJsonSegment(cleaned)].filter((x): x is string => Boolean(x));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as RawGeneratedArticle;
      if (typeof parsed.title === 'string' && typeof parsed.content === 'string') {
        return parsed;
      }
    } catch {
      // ignore parsing error and fallback to next strategy
    }
  }

  return fallbackExtractArticle(cleaned);
}

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readableWordCount(content: string): number {
  return content.replace(/\s+/g, '').length;
}

export function validateGeneratedArticle(
  article: RawGeneratedArticle,
  options: ValidationOptions,
): ValidatedArticle {
  const title = (article.title ?? '').trim();
  const content = normalizeContent(article.content ?? '');

  if (!title) {
    throw new Error('Generated article title is empty');
  }
  if (!content) {
    throw new Error('Generated article content is empty');
  }

  const wordCount = readableWordCount(content);
  if (wordCount < options.minWords) {
    throw new Error(`Generated article too short: ${wordCount} < ${options.minWords}`);
  }
  // Keep upper bound very soft; requirement focuses on not being too short.
  // We only reject extreme overflow to avoid pathological responses.
  const hardMax = Math.max(options.maxWords + 2000, Math.floor(options.maxWords * 3));
  if (wordCount > hardMax) {
    throw new Error(`Generated article too long: ${wordCount} > ${hardMax}`);
  }

  const contentHash = createHash('sha256').update(`${title}\n${content}`).digest('hex');

  return {
    title,
    content,
    wordCount,
    contentHash,
  };
}
