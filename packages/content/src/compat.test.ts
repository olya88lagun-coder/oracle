import { describe, expect, test } from "vitest";
import { CompatFormatError, parseCompatUnions } from "./compat";

const ONE = `## 7. Колесница
Суть союза: Вы вместе движетесь к общей цели.
Что даёт: Общий курс и готовность держаться его.
Где стоит присмотреться: К тому, кто из вас задаёт темп.
Вопрос для двоих: Куда мы на самом деле хотим двигаться вместе?
`;

describe("parseCompatUnions", () => {
  test("reads the heading and the four fields", () => {
    expect(parseCompatUnions(ONE)).toEqual([
      {
        number: 7,
        name: "Колесница",
        essence: "Вы вместе движетесь к общей цели.",
        gives: "Общий курс и готовность держаться его.",
        attention: "К тому, кто из вас задаёт темп.",
        question: "Куда мы на самом деле хотим двигаться вместе?",
      },
    ]);
  });

  test("sorts by number and rejects a missing field, an unknown line, a repeat and text before the first heading", () => {
    const two = `${ONE.replace("7. Колесница", "9. Отшельник")}\n${ONE}`;
    expect(parseCompatUnions(two).map((u) => u.number)).toEqual([7, 9]);
    expect(() => parseCompatUnions(ONE.replace(/Что даёт:.*\n/, ""))).toThrow(CompatFormatError);
    expect(() => parseCompatUnions(`${ONE}Лишняя строка\n`)).toThrow(CompatFormatError);
    expect(() => parseCompatUnions(`${ONE}\n${ONE}`)).toThrow(/повторя/);
    expect(() => parseCompatUnions(`вступление\n${ONE}`)).toThrow(CompatFormatError);
    expect(() => parseCompatUnions(ONE.replace("7.", "23."))).toThrow(/от 1 до 22/);
  });
});
