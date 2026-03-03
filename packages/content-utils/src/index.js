export function createExcerpt(content, maxLength = 180) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
}
export function estimateReadMinutes(content) {
  const effectiveChars = content.replace(/\s+/g, '').length;
  const charsPerMinute = 260;
  return Math.max(1, Math.ceil(effectiveChars / charsPerMinute));
}
export function estimateReadMinutesFromWordCount(wordCount) {
  const charsPerMinute = 260;
  return Math.max(1, Math.ceil(wordCount / charsPerMinute));
}
