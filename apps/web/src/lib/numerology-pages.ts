import { acceptedNumerologyPages, numerologyText } from "@oracle/content/numerology";
import { CLOCK_TIMES, type ClockTime } from "@oracle/core";
import { THREAD_PATH, type ThreadCard, type ThreadTexts } from "./life-thread";
import { clockPath, fatePath, personalYearPath } from "./numerology";
import { PYTHAGORAS_COMPAT_PATH, PYTHAGORAS_PATH } from "./pythagoras";

// Только для сервера: @oracle/content/numerology несёт все тексты нумерологии, в браузерный чанк их не пускаем (lib/client-bundle.test.ts).
// Только принятые партии: у непринятых страниц нет адреса в карте сайта и ссылок
export function acceptedFatePaths(): string[] {
  return acceptedNumerologyPages("fate").map((page) => fatePath(Number(page.key)));
}

export function acceptedPersonalYearPaths(): string[] {
  return acceptedNumerologyPages("year").map((page) => personalYearPath(Number(page.key)));
}

export function acceptedClockPaths(): string[] {
  return acceptedNumerologyPages("clock").map((page) => clockPath(page.key));
}

const sameGroup = (a: ClockTime, b: ClockTime): boolean => a.kind === "both" || b.kind === "both" || a.kind === b.kind;

// 2–3 ближайших по времени суток принятых времени той же группы — ряд «Другие значения»
export function relatedClocks(slug: string): readonly ClockTime[] {
  const self = CLOCK_TIMES.find((time) => time.slug === slug);
  if (!self) return [];
  const accepted = new Set(acceptedNumerologyPages("clock").map((page) => page.key));
  const at = (t: ClockTime) => t.hours * 60 + t.minutes;
  return CLOCK_TIMES.filter((time) => time !== self && accepted.has(time.slug) && sameGroup(self, time))
    .sort((a, b) => Math.abs(at(a) - at(self)) - Math.abs(at(b) - at(self)))
    .slice(0, 3)
    .sort((a, b) => at(a) - at(b));
}

export function acceptedSquarePaths(): string[] {
  return acceptedNumerologyPages("square").map((page) => `${PYTHAGORAS_PATH}/${page.key}`);
}

// Совместимость открыта только с принятой партией 8: до этого нет ни адреса в карте сайта, ни ссылок
export function acceptedPairPaths(): string[] {
  return acceptedNumerologyPages("pair").length ? [PYTHAGORAS_COMPAT_PATH] : [];
}

// «Нить» открыта, когда приняты оба вида текстов партии 9: до этого нет ни страницы, ни адреса в карте сайта, ни ссылок
export function acceptedThreadPaths(): string[] {
  return acceptedNumerologyPages("thread").length && acceptedNumerologyPages("period").length ? [THREAD_PATH] : [];
}

// Платный «Разбор нити» собирается из текстов партии 10: пока владелица не приняла все три вида, продажи нет даже при PAID_THREAD=on
export function threadReportReady(): boolean {
  return (["month", "past", "rules"] as const).every((kind) => acceptedNumerologyPages(kind).length > 0);
}

// Карточки годов и периодов для клиентской части: уходят пропсами, сами тексты в браузерный чанк не попадают
export function acceptedThreadTexts(): ThreadTexts {
  const collect = (kind: "thread" | "period"): Record<number, ThreadCard> => {
    const cards: Record<number, ThreadCard> = {};
    for (const page of acceptedNumerologyPages(kind)) {
      const text = numerologyText(kind, page.key);
      if (text) cards[Number(page.key)] = { sections: text.sections.map(({ title, paragraphs }) => ({ title, paragraphs })) };
    }
    return cards;
  };
  return { years: collect("thread"), periods: collect("period") };
}
