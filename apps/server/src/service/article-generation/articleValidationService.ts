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

function extractJsonStringField(source: string, key: string): string | null {
  const keyToken = `"${key}"`;
  const keyIndex = source.indexOf(keyToken);
  if (keyIndex === -1) {
    return null;
  }

  const colonIndex = source.indexOf(':', keyIndex + keyToken.length);
  if (colonIndex === -1) {
    return null;
  }

  let i = colonIndex + 1;
  while (i < source.length && /\s/.test(source[i])) {
    i += 1;
  }
  if (source[i] !== '"') {
    return null;
  }
  i += 1;

  let escaped = false;
  let raw = '';
  while (i < source.length) {
    const ch = source[i];
    if (escaped) {
      raw += ch;
      escaped = false;
      i += 1;
      continue;
    }
    if (ch === '\\') {
      raw += ch;
      escaped = true;
      i += 1;
      continue;
    }
    if (ch === '"') {
      try {
        return JSON.parse(`"${raw}"`) as string;
      } catch {
        return null;
      }
    }
    raw += ch;
    i += 1;
  }

  return null;
}

function extractArticleFromJsonLike(value: string): RawGeneratedArticle | null {
  if (!value.includes('"title"') || !value.includes('"content"')) {
    return null;
  }
  const title = extractJsonStringField(value, 'title');
  const content = extractJsonStringField(value, 'content');
  if (!title || !content) {
    return null;
  }
  return { title, content };
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

  const jsonLikeParsed = extractArticleFromJsonLike(cleaned);
  if (jsonLikeParsed) {
    return jsonLikeParsed;
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
  if (title === '{') {
    throw new Error('Generated article title malformed: raw JSON wrapper leaked');
  }
  if (!content) {
    throw new Error('Generated article content is empty');
  }
  if (
    (content.startsWith('{') || content.startsWith('```')) &&
    content.includes('"title"') &&
    content.includes('"content"')
  ) {
    throw new Error('Generated article content malformed: raw JSON wrapper leaked');
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
