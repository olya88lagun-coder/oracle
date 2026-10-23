import { describe, expect, test } from "vitest";
import { MATRIX_PATH } from "./arcana-paths";
import { FREE_MATRIX_CTA, FREE_RESULT_PROMISE, FREE_RESULT_TERMS } from "./practices";
import { TARO_BRIDGE, TARO_BRIDGE_CTA_GOAL } from "./taro-bridge";

const PROMISES = /точн(ый|ое|ого) (прогноз|ответ)|гарантир|узнаете будущее|предскажет|покажет, что будет/i;
const PRICES = /₽|руб|оплат|куп[иь]|скидк/i;

describe("bridge from Taro to the matrix", () => {
  test("leads to the free matrix calculation with the one site-wide call to action and the same promise", () => {
    expect(TARO_BRIDGE.href).toBe(MATRIX_PATH);
    expect(TARO_BRIDGE.cta).toBe(FREE_MATRIX_CTA);
    expect(TARO_BRIDGE.promise).toBe(FREE_RESULT_PROMISE);
    expect(TARO_BRIDGE.terms).toBe(FREE_RESULT_TERMS);
  });

  test("has a text for a card page and for the card of the day, each of its own and snippet-sized", () => {
    expect(TARO_BRIDGE.text.card).not.toBe(TARO_BRIDGE.text.day);
    for (const text of Object.values(TARO_BRIDGE.text)) {
      expect(text.length).toBeGreaterThan(80);
      expect(text.length).toBeLessThan(320);
    }
  });

  test("keeps the site tone: no predictions, no prices, no pressure", () => {
    const copy = [TARO_BRIDGE.title, TARO_BRIDGE.promise, ...Object.values(TARO_BRIDGE.text)].join(" ");
    expect(copy).not.toMatch(PROMISES);
    expect(copy).not.toMatch(PRICES);
    expect(copy).not.toMatch(/успейте|только сегодня|срочно/i);
    expect(copy).toMatch(/не прогноз/i);
  });

  test("counts the click with the existing goal for transitions from Taro to other practices", () => {
    expect(TARO_BRIDGE_CTA_GOAL).toBe("taro_to_practice");
  });
});
