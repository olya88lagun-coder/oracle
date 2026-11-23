import { describe, expect, test } from "vitest";
import { spreadSummaryText, TARO_SPREADS, type SpreadPosition } from "./taro-spreads";

const position = (title: string): SpreadPosition => ({ title, hint: "", source: "essence" });
const empty = { noticed: "", open: "", step: "" };

describe("spread summary", () => {
  test("only the choice spread marks positions with variants, two each", () => {
    for (const spread of TARO_SPREADS) {
      const marked = spread.positions.filter((p) => p.variant);
      expect(marked.length).toBe(spread.slug === "vybor" ? 4 : 0);
    }
    const vybor = TARO_SPREADS.find((s) => s.slug === "vybor")!;
    for (const p of vybor.positions.filter((x) => x.variant)) expect(p.title).toContain(`Вариант ${p.variant}`);
  });

  test("copy text skips empty parts and keeps card order", () => {
    const text = spreadSummaryText({
      name: "Расклад на выбор из двух",
      question: "  ",
      variants: { А: "остаться", Б: "" },
      rows: [
        { position: position("Вариант А: что даёт"), card: "Маг" },
        { position: position("Вопрос для себя"), card: "Звезда" },
      ],
      summary: { ...empty, step: " позвонить " },
    });
    expect(text).toBe("Расклад на выбор из двух\nВариант А: остаться\n\nВариант А: что даёт — Маг\nВопрос для себя — Звезда\n\nОдин небольшой шаг: позвонить");
  });

  test("question and own summary appear when filled", () => {
    const text = spreadSummaryText({ name: "Три карты", question: "Что важно?", variants: { А: "", Б: "" }, rows: [{ position: position("Ситуация"), card: "Маг" }], summary: { noticed: "а", open: "б", step: "в" } });
    expect(text).toContain("Вопрос: Что важно?");
    expect(text).toContain("Что отозвалось: а\nЧто осталось вопросом: б\nОдин небольшой шаг: в");
  });
});
