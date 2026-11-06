import { describe, expect, test } from "vitest";
import { ARCANA } from "./index";
import { checkYearTexts, parseYearTexts, YearFormatError } from "./year";
import { YEAR_TEXTS, yearTextByNumber } from "./year-texts";

const ONE = `## 7. Колесница
Тема года: Тема.
Что поддерживает: Опора.
На что обратить внимание: Внимание.
В отношениях: Близость.
В деле и деньгах: Дело.
Вопрос года: Куда я иду?
`;

const names = new Map(ARCANA.map((arcanum) => [arcanum.number, arcanum.name] as const));

describe("parseYearTexts", () => {
  test("reads the heading and the six fields", () => {
    expect(parseYearTexts(ONE)).toEqual([
      { number: 7, name: "Колесница", theme: "Тема.", supports: "Опора.", attention: "Внимание.", love: "Близость.", money: "Дело.", question: "Куда я иду?" },
    ]);
  });

  test("rejects a missing field, an unknown line, a repeat and a number out of range", () => {
    expect(() => parseYearTexts(ONE.replace(/В отношениях:.*\n/, ""))).toThrow(YearFormatError);
    expect(() => parseYearTexts(`${ONE}Лишнее: строка\n`)).toThrow(/неизвестная строка/);
    expect(() => parseYearTexts(`${ONE}\n${ONE}`)).toThrow(/повторяется/);
    expect(() => parseYearTexts(ONE.replace("7.", "23."))).toThrow(/от 1 до 22/);
  });
});

describe("year texts", () => {
  test("are all 22, named as the arcana and pass the checks", () => {
    expect(checkYearTexts(YEAR_TEXTS, names)).toEqual([]);
    expect(yearTextByNumber(15).name).toBe("Дьявол");
  });

  test("the check catches short fields, a question without «?» and stop phrases", () => {
    const broken = [{ ...yearTextByNumber(1), theme: "Коротко.", question: "Без знака", money: `${yearTextByNumber(1).money} Вас ждёт успех.` }, ...YEAR_TEXTS.slice(1)];
    const errors = checkYearTexts(broken, names).join("\n");
    expect(errors).toMatch(/theme/);
    expect(errors).toMatch(/«\?»/);
    expect(errors).toMatch(/запрещённые обороты/);
  });
});
