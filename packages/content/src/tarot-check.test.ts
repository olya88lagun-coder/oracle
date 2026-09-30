import { describe, expect, test } from "vitest";
import type { TarotCard } from "./tarot";
import { checkTarotCards } from "./tarot-check";
import { TAROT_DECK } from "./tarot-deck";

const text = (n: number) => `${"слово ".repeat(n).trim()}.`;
const list = ["Первый пункт списка", "Второй пункт списка", "Третий пункт списка"];
const card = (ref: (typeof TAROT_DECK)[number], patch: Partial<TarotCard> = {}): TarotCard => ({
  ...ref,
  keywords: ["один", "два", "три"],
  essence: [text(80), text(80)],
  love: [text(60)],
  money: [text(60)],
  resource: list,
  distortion: list,
  day: [text(50)],
  action: text(12),
  question: `Вопрос номер ${ref.order} для вас?`,
  ...patch,
});
const full = () => TAROT_DECK.map((ref) => card(ref));

describe("checkTarotCards", () => {
  test("accepts a full valid deck", () => {
    expect(checkTarotCards(full())).toEqual([]);
  });

  test("reports a missing card, a header that differs from the manifest and repeated questions", () => {
    expect(checkTarotCards(full().slice(1)).join("\n")).toMatch(/карт 77, нужно 78/);
    expect(checkTarotCards([card(TAROT_DECK[0]!, { name: "Другое" }), ...full().slice(1)]).join("\n")).toMatch(/не совпадает с манифестом/);
    expect(checkTarotCards([card(TAROT_DECK[0]!, { question: "Вопрос номер 2 для вас?" }), ...full().slice(1)]).join("\n")).toMatch(/вопрос совпадает/);
  });

  test("reports short and long sections, few words, a question without «?», a bad list item and stop phrases", () => {
    const first = TAROT_DECK[0]!;
    const rest = full().slice(1);
    expect(checkTarotCards([card(first, { essence: [text(10), text(10)] }), ...rest]).join("\n")).toMatch(/essence/);
    expect(checkTarotCards([card(first, { love: [text(400)] }), ...rest]).join("\n")).toMatch(/love/);
    expect(checkTarotCards([card(first, { essence: [text(60)] }), ...rest]).join("\n")).toMatch(/минимум два абзаца/);
    expect(checkTarotCards([card(first, { question: "Вопрос без знака для вас" }), ...rest]).join("\n")).toMatch(/«\?»/);
    expect(checkTarotCards([card(first, { resource: ["ок", "два пункта", "три пункта"] }), ...rest]).join("\n")).toMatch(/пункт списка/);
    expect(checkTarotCards([card(first, { day: [`${text(40)} Вас ждёт успех.`] }), ...rest]).join("\n")).toMatch(/запрещённые обороты/);
    expect(checkTarotCards([card(first, { essence: [text(40), text(40)], love: [text(35)], money: [text(35)], day: [text(30)] }), ...rest]).join("\n")).toMatch(/слов \d+, нужно не меньше 330/);
  });
});
