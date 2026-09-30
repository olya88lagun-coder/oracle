import { calculateCompatibility, parseBirthDate } from "@oracle/core";
import { buildCompatPdf } from "./compat-pdf";

// Даты живут только внутри этой функции: дальше идёт готовый расчёт. Ни логов, ни записи на диск
export async function createCompatPdf(body: unknown, now: Date, assetsDir: string): Promise<{ ok: true; pdf: Buffer } | { ok: false; error: "invalid" }> {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const first = parseBirthDate(record.a, now);
  const second = parseBirthDate(record.b, now);
  if (!first || !second) return { ok: false, error: "invalid" };
  const pdf = await buildCompatPdf({ compat: calculateCompatibility(first, second), madeAt: now, assetsDir });
  return { ok: true, pdf };
}
