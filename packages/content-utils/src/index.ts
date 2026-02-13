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
