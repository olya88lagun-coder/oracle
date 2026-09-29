const DESCRIPTION_LIMIT = 160;

export function shortDescription(text: string): string {
  if (text.length <= DESCRIPTION_LIMIT) return text;
  const cut = text.slice(0, DESCRIPTION_LIMIT - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
