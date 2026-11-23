import { LILA_MAX_MOVES } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { LilaPassport } from "./LilaPassport";

describe("LilaPassport", () => {
  const guest = renderToStaticMarkup(<LilaPassport guest />);
  const member = renderToStaticMarkup(<LilaPassport guest={false} />);

  test("is a labelled section that lists entry, goal, finish, limit and how to continue, with numbers from the engine", () => {
    expect(guest).toContain('aria-labelledby="lila-passport-title"');
    for (const term of ["Вход на поле", "Цель", "Завершить партию", "Предел", "Продолжить позже"]) expect(guest).toContain(`<dt>${term}</dt>`);
    expect(guest).toContain("Выпала 6");
    expect(guest).toContain("Клетка 68");
    expect(guest).toContain("стрелой с клетки 54");
    expect(guest).toContain("начиная с 10-го хода");
    expect(guest).toContain(`Не больше ${LILA_MAX_MOVES} ходов`);
  });

  test("tells a guest that the game stays in this browser and a signed-in player that it is kept in the portrait", () => {
    expect(guest).toContain("в этом же браузере");
    expect(member).toContain("«Моём портрете»");
    expect(member).not.toContain("в этом же браузере");
  });

  test("says that these are the rules of this site and links to the rules article", () => {
    expect(guest).toContain("Это правила нашего сайта");
    expect(guest).toContain('href="/blog/kak-igrat-v-lilu-onlain"');
  });

  test("adds no headline of level one or two: the page keeps its single h1", () => {
    expect(guest).not.toMatch(/<h[12][ >]/);
  });
});
