export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 40;

export function normalizeQuery(text: string): string {
  return text.toLowerCase().replaceAll("ё", "е").replace(/[-–—]+/g, " ").replace(/\s+/g, " ").trim();
}
