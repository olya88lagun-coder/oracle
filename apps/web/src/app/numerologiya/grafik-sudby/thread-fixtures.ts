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
