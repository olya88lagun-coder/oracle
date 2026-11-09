import { describe, expect, test } from "vitest";
import { CompatFormatError } from "./compat";
import { checkCompatSpheres, parseCompatSpheres } from "./compat-spheres";
import { COMPAT_SPHERES, COMPAT_SPHERES_ACCEPTED, compatSpheresByNumber } from "./compat-unions";
import { ARCANA } from "./index";

const ONE = `## 7. Колесница
Что сближает: Общие цели.
Где возможны разногласия: Разная скорость.
Как договариваться: Сверять курс.
Вопрос для разговора: Куда мы идём?
`;

describe("parseCompatSpheres", () => {
  test("reads the heading and the four fields", () => {
    expect(parseCompatSpheres(ONE)).toEqual([
      { number: 7, name: "Колесница", closer: "Общие цели.", friction: "Разная скорость.", agree: "Сверять курс.", question: "Куда мы идём?" },
    ]);
  });

  test("rejects a missing field, an unknown line, a repeat and text before the first heading", () => {
    expect(() => parseCompatSpheres(ONE.replace(/Как договариваться:.*\n/, ""))).toThrow(/Как договариваться/);
    expect(() => parseCompatSpheres(`${ONE}Лишняя строка\n`)).toThrow(CompatFormatError);
    expect(() => parseCompatSpheres(`${ONE}\n${ONE}`)).toThrow(/повторя/);
    expect(() => parseCompatSpheres(`вступление\n${ONE}`)).toThrow(CompatFormatError);
  });
});

describe("compat spheres texts", () => {
  test("are all 22, named as the arcana and pass the checks", () => {
    const names = new Map(ARCANA.map((arcanum) => [arcanum.number, arcanum.name] as const));
    expect(checkCompatSpheres(COMPAT_SPHERES, names)).toEqual([]);
  });

  test("the check catches short texts, a question without «?» and stop phrases", () => {
    const names = new Map([[7, "Колесница"]] as const);
    const errors = checkCompatSpheres(parseCompatSpheres(ONE.replace("Куда мы идём?", "Вас ждёт успех.")), names).join("\n");
    expect(errors).toMatch(/Что сближает/);
    expect(errors).toMatch(/«\?»/);
    expect(errors).toMatch(/запрещённые обороты/);
  });

  test("stay off the site until the batch is accepted", () => {
    expect(compatSpheresByNumber(7)?.name).toBe(COMPAT_SPHERES_ACCEPTED ? "Колесница" : undefined);
  });
});
