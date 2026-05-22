export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

export function tocSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Assigns stable heading ids matching {@link extractTocHeadings} duplicate rules. */
export function createTocIdAssigner(): (text: string) => string | null {
  const idCount: Record<string, number> = {};
  return (text: string) => {
    const baseId = tocSlug(text);
    if (!baseId) return null;
    const count = idCount[baseId] ?? 0;
    idCount[baseId] = count + 1;
    return count === 0 ? baseId : `${baseId}-${count}`;
  };
}

function stripInlineFormatting(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

export function extractTocHeadings(markdown: string): TocHeading[] {
  // Strip fenced code blocks so headings inside them are ignored
  const stripped = markdown.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1\s*$/gm, '');
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\s+#+)?$/gm;
  const assignId = createTocIdAssigner();
  const headings: TocHeading[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length;
    const text = stripInlineFormatting(match[2]);
    const id = assignId(text);
    if (!id) continue;
    headings.push({ level, text, id });
  }

  return headings;
}

export function createExcerpt(content: string, maxLength = 180): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function estimateReadMinutes(content: string): number {
  const effectiveChars = content.replace(/\s+/g, '').length;
  const charsPerMinute = 260;
  return Math.max(1, Math.ceil(effectiveChars / charsPerMinute));
}

export function estimateReadMinutesFromWordCount(wordCount: number): number {
  const charsPerMinute = 260;
  return Math.max(1, Math.ceil(wordCount / charsPerMinute));
}
