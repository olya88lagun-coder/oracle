import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import { describe, expect, test } from "vitest";
import type { LilaCell } from "./lila";
import { checkLilaCells } from "./lila-check";

const hasTransition = (n: number) => n in LILA_SNAKES || n in LILA_ARROWS;
// Число → строка из букв a–j: slug допускает только латиницу и дефис
const letters = (number: number) => Array.from(String(number), (digit) => String.fromCharCode(97 + Number(digit))).join("");
const goodCell = (number: number): LilaCell => ({
  number,
  name: `Клетка ${number}`,
  slug: `kletka-${letters(number)}`,
  about: "Описание клетки в тоне гипотез: это может говорить о теме, к которой стоит присмотреться и сегодня, и позже. ".repeat(2).trim(),
  questions: ["Что вы замечаете в этой теме сейчас?", "Что изменилось с прошлого визита сюда?", "Что остаётся прежним и почему?"],
  transition: hasTransition(number) ? "Вы возвращаетесь к теме, которая ждёт внимания." : null,
});
const all = () => Array.from({ length: 72 }, (_, index) => goodCell(index + 1));

describe("checkLilaCells", () => {
  test("accepts a complete set", () => {
    expect(checkLilaCells(all())).toEqual([]);
  });

  test("reports a wrong count and a repeated slug", () => {
    expect(checkLilaCells(all().slice(1))[0]).toMatch(/71/);
    const cells = all();
    cells[1] = { ...cells[1]!, slug: cells[0]!.slug };
    expect(checkLilaCells(cells).join("\n")).toMatch(/slug/);
  });

  test("requires a transition exactly on snake heads and arrow starts", () => {
    const cells = all();
    cells[11] = { ...cells[11]!, transition: null };
    cells[1] = { ...cells[1]!, transition: "Лишний переход у обычной клетки, которого быть не должно." };
    const errors = checkLilaCells(cells).join("\n");
    expect(errors).toMatch(/клетка 12.*переход/i);
    expect(errors).toMatch(/клетка 2:.*переход/i);
  });

  test("rejects stop phrases, questions without a question mark and texts out of length", () => {
    const cells = all();
    cells[4] = { ...cells[4]!, about: `${cells[4]!.about} Вас ждет успех.` };
    cells[5] = { ...cells[5]!, questions: ["Это утверждение?", "Что вы видите здесь сейчас?", "Не вопрос"] };
    cells[6] = { ...cells[6]!, about: "Коротко." };
    const errors = checkLilaCells(cells).join("\n");
    expect(errors).toMatch(/клетка 5.*запрещённые обороты/);
    expect(errors).toMatch(/клетка 6.*вопрос 3/);
    expect(errors).toMatch(/клетка 7.*О чём это/);
  });

  test("rejects identical questions in one cell", () => {
    const cells = all();
    cells[7] = { ...cells[7]!, questions: [cells[7]!.questions[0], cells[7]!.questions[0], cells[7]!.questions[2]] };
    expect(checkLilaCells(cells).join("\n")).toMatch(/клетка 8.*совпада/);
  });
});
