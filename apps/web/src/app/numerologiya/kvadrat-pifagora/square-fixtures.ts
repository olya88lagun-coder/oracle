import type * as Content from "@oracle/content/numerology";

// Тексты-заготовки квадрата для тестов страниц, пока настоящих текстов (партии 6 и 7) нет или они не приняты.
// Модуль не импортирует @oracle/content/numerology во время выполнения: он сам подставляется вместо него в vi.mock
export const SQUARE_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "linii"] as const;

function squareFixture(real: typeof Content, key: string): Content.NumerologyText {
  return {
    kind: "square",
    key,
    title: key === "linii" ? "Линии в квадрате Пифагора" : `Ячейка ${key} в квадрате Пифагора`,
    description: `Описание страницы ${key} для теста.`,
    batch: key === "linii" || Number(key) > 5 ? 7 : 6,
    sections: real.squareSectionTitles(key).slice(0, -1).map((title) => ({ title, paragraphs: [`Первый абзац: ${title}.`, "Второй абзац."], items: [] })),
    faq: [{ question: "Первый вопрос?", answer: "Ответ." }, { question: "Второй вопрос?", answer: "Ответ." }],
  };
}

// Мок @oracle/content/numerology: квадрат открыт целиком, остальное — как на самом деле
export async function mockSquareAccepted(importOriginal: () => Promise<typeof Content>): Promise<typeof Content> {
  const real = await importOriginal();
  const isKey = (key: string) => (SQUARE_KEYS as readonly string[]).includes(key);
  return {
    ...real,
    numerologyText: (kind, key) => (kind === "square" ? (isKey(key) ? squareFixture(real, key) : undefined) : real.numerologyText(kind, key)),
    acceptedNumerologyPages: (kind) => (kind === "square" ? SQUARE_KEYS.map((key) => ({ kind, key, batch: squareFixture(real, key).batch })) : real.acceptedNumerologyPages(kind)),
  };
}
