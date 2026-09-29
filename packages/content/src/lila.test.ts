import { describe, expect, test } from "vitest";
import { LilaFormatError, parseLilaCells } from "./lila";

const cell = (number: number, name: string, extra = "") => `## ${number}. ${name}
slug: kletka
О чём это: Описание клетки, которое звучит как гипотеза.
Вопрос 1: Что вы замечаете здесь?
Вопрос 2: Что изменилось с прошлого раза?
Вопрос 3: Что осталось прежним?
${extra}`;

describe("parseLilaCells", () => {
  test("reads the number, name, texts and the optional transition", () => {
    const [first, second] = parseLilaCells(`${cell(2, "Майя")}\n${cell(1, "Рождение", "Переход: Вы возвращаетесь к теме.")}`);
    expect(first).toMatchObject({ number: 1, name: "Рождение", slug: "kletka", transition: "Вы возвращаетесь к теме." });
    expect(first?.questions).toEqual(["Что вы замечаете здесь?", "Что изменилось с прошлого раза?", "Что осталось прежним?"]);
    expect(second).toMatchObject({ number: 2, name: "Майя", transition: null });
  });

  test("fails with the cell number on a missing field", () => {
    expect(() => parseLilaCells("## 3. Гнев\nslug: gnev\nО чём это: Текст.")).toThrow(LilaFormatError);
    expect(() => parseLilaCells("## 3. Гнев\nslug: gnev\nО чём это: Текст.")).toThrow(/3/);
  });

  test("fails on a duplicate field, an unknown line, a bad slug and text before the first cell", () => {
    expect(() => parseLilaCells(`${cell(4, "Жадность")}\nО чём это: ещё раз`)).toThrow(LilaFormatError);
    expect(() => parseLilaCells(`${cell(4, "Жадность")}\nЛишнее: строка`)).toThrow(LilaFormatError);
    expect(() => parseLilaCells(cell(4, "Жадность").replace("slug: kletka", "slug: Kletka 1"))).toThrow(LilaFormatError);
    expect(() => parseLilaCells(`вступление\n${cell(4, "Жадность")}`)).toThrow(LilaFormatError);
  });

  test("fails on a number outside 1-72 and on the same number twice", () => {
    expect(() => parseLilaCells(cell(73, "Лишняя"))).toThrow(LilaFormatError);
    expect(() => parseLilaCells(`${cell(5, "А")}\n${cell(5, "Б")}`)).toThrow(LilaFormatError);
  });
});
