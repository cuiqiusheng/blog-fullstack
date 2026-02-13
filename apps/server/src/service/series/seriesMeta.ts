import { normalizeOptionalText } from '../shared/textNormalization';

export interface SeriesMeta {
  seriesKey: string;
  seriesOrder: number;
}

export function parseSeriesMetaFromSubtopic(
  subtopic: string | null | undefined,
): SeriesMeta | null {
  const normalizedSubtopic = normalizeOptionalText(subtopic);
  if (!normalizedSubtopic) {
    return null;
  }

  const match = /^(.+)-(\d+)-[^-].*$/.exec(normalizedSubtopic);
  if (!match) {
    return null;
  }

  const seriesOrder = Number(match[2]);
  if (!Number.isInteger(seriesOrder) || seriesOrder <= 0) {
    return null;
  }

  return {
    seriesKey: match[1],
    seriesOrder,
  };
}
