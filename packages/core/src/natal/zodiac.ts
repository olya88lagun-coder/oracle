export const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const;
export type SignId = (typeof SIGNS)[number];

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function signOf(longitude: number): { sign: SignId; index: number; degree: number } {
  const normalized = normalizeDegrees(longitude);
  const index = Math.floor(normalized / 30);
  return { sign: SIGNS[index] as SignId, index, degree: normalized - index * 30 };
}

// Наименьшая угловая разница двух долгот, 0…180
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}
