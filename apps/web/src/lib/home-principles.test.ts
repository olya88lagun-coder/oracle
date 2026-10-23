import { describe, expect, test } from "vitest";
import { HOME_PRINCIPLES, HOME_PRINCIPLES_TITLE } from "./home-principles";
import { PUBLIC_PATHS } from "./seo";

const PROMISES = /точн(ый|ое|ого) (прогноз|ответ)|гарантир|узнаете будущее|предскажет|покажет, что будет/i;
const PRICES = /₽|руб|оплат|куп[иь]|скидк/i;

describe("home page: what sets the site apart", () => {
  test("has four short principles, each with a title and a text, and a title for the section", () => {
    expect(HOME_PRINCIPLES_TITLE.length).toBeGreaterThan(10);
    expect(HOME_PRINCIPLES).toHaveLength(4);
    expect(new Set(HOME_PRINCIPLES.map((item) => item.title)).size).toBe(4);
    for (const item of HOME_PRINCIPLES) {
      expect(item.title.length).toBeGreaterThan(8);
      expect(item.title.length).toBeLessThanOrEqual(40);
      expect(item.text.length).toBeGreaterThan(80);
      expect(item.text.length).toBeLessThanOrEqual(260);
    }
  });

  test("claims only what the site does: private calculation, no predictions, AI guide named as AI, open methodology", () => {
    const text = (index: number) => HOME_PRINCIPLES[index]?.text ?? "";
    expect(text(0)).toMatch(/в вашем браузере/);
    expect(text(0)).toMatch(/только по вашему действию/);
    expect(text(1)).toMatch(/не предсказываем/);
    expect(text(2)).toMatch(/Абзацы проводника пишет ИИ\./);
    expect(HOME_PRINCIPLES[3]?.href).toBe("/metodika");
    expect(PUBLIC_PATHS).toContain("/metodika");
  });

  test("makes no promises of prediction and names no prices, since prices appear on the page only while sales are on", () => {
    const copy = HOME_PRINCIPLES.map((item) => `${item.title} ${item.text}`).join(" ");
    expect(copy).not.toMatch(PROMISES);
    expect(copy).not.toMatch(PRICES);
    expect(copy).not.toMatch(/единственн|никто|лучш[ие]й|№ ?1/i);
  });
});
