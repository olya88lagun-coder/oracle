import type * as Content from "@oracle/content/numerology";

// Тексты-заготовки нити для тестов страниц, пока партия 9 не принята.
// Модуль не импортирует @oracle/content/numerology во время выполнения: он сам подставляется вместо него в vi.mock
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

function fixture(real: typeof Content, kind: "thread" | "period", key: string): Content.NumerologyText {
  return {
    kind,
    key,
    title: `Заготовка ${kind} ${key}`,
    description: `Описание страницы ${kind} ${key} для теста.`,
    batch: 9,
    sections: real.NUMEROLOGY_SECTION_TITLES[kind].map((title) => ({ title, paragraphs: [`Первый абзац: ${title}.`, "Второй абзац."], items: [] })),
    faq: [],
  };
}

// Мок @oracle/content/numerology: партия 9 не принята (нить закрыта), остальное — как на самом деле
export async function mockThreadClosed(importOriginal: () => Promise<typeof Content>): Promise<typeof Content> {
  const real = await importOriginal();
  const isThread = (kind: string): boolean => kind === "thread" || kind === "period";
  return {
    ...real,
    numerologyText: (kind, key) => (isThread(kind) ? undefined : real.numerologyText(kind, key)),
    acceptedNumerologyPages: (kind) => (isThread(kind) ? [] : real.acceptedNumerologyPages(kind)),
  };
}

// Мок @oracle/content/numerology: партия 9 принята, остальное — как на самом деле
export async function mockThreadAccepted(importOriginal: () => Promise<typeof Content>): Promise<typeof Content> {
  const real = await importOriginal();
  const isThread = (kind: string): kind is "thread" | "period" => kind === "thread" || kind === "period";
  return {
    ...real,
    numerologyText: (kind, key) => (isThread(kind) ? ((KEYS as readonly string[]).includes(key) ? fixture(real, kind, key) : undefined) : real.numerologyText(kind, key)),
    acceptedNumerologyPages: (kind) => (isThread(kind) ? KEYS.map((key) => ({ kind, key, batch: 9 })) : real.acceptedNumerologyPages(kind)),
  };
}

// Мок @oracle/content/numerology для платного «Разбора нити»: партия 10 (month, past, rules) принята, пока accepted() — true,
// иначе закрыта независимо от настоящего списка партий; остальное — как на самом деле
export async function mockThreadReportBatch(importOriginal: () => Promise<typeof Content>, accepted: () => boolean = () => true): Promise<typeof Content> {
  const real = await importOriginal();
  const isReport = (kind: string): boolean => kind === "month" || kind === "past" || kind === "rules";
  return {
    ...real,
    acceptedNumerologyPages: (kind) => (isReport(kind) ? (accepted() ? KEYS.map((key) => ({ kind, key, batch: 10 })) : []) : real.acceptedNumerologyPages(kind)),
  };
}

function reportFixture(real: typeof Content, kind: "month" | "past" | "rules", key: string): Content.NumerologyText {
  return {
    kind,
    key,
    title: `Заготовка ${kind} ${key}`,
    description: `Описание страницы ${kind} ${key} для теста.`,
    batch: 10,
    sections: real.NUMEROLOGY_SECTION_TITLES[kind].map((title) => ({ title, paragraphs: [`Первый абзац: ${title}.`, "Второй абзац."], items: [] })),
    faq: [],
  };
}

// Мок @oracle/content/numerology: приняты и партия 9, и партия 10, с короткими заготовками текстов (для страницы-примера разбора)
export async function mockThreadReportOpen(importOriginal: () => Promise<typeof Content>): Promise<typeof Content> {
  const real = await importOriginal();
  const accepted = await mockThreadAccepted(importOriginal);
  const isReport = (kind: string): kind is "month" | "past" | "rules" => kind === "month" || kind === "past" || kind === "rules";
  return {
    ...accepted,
    numerologyText: (kind, key) => (isReport(kind) ? ((KEYS as readonly string[]).includes(key) ? reportFixture(real, kind, key) : undefined) : accepted.numerologyText(kind, key)),
    acceptedNumerologyPages: (kind) => (isReport(kind) ? KEYS.map((key) => ({ kind, key, batch: 10 })) : accepted.acceptedNumerologyPages(kind)),
  };
}
