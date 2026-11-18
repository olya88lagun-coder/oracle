import { describe, expect, test } from "vitest";
import { THREAD_CHAPTER_IDS, THREAD_CHAPTER_TITLES } from "./index";

describe("главы разбора нити", () => {
  test("шесть глав с названиями по порядку", () => {
    expect(THREAD_CHAPTER_IDS.map((id) => THREAD_CHAPTER_TITLES[id])).toEqual(["Где вы сейчас", "Семь лет вперёд", "Прошлые годы", "Четыре периода жизни", "Ваш ритм", "Три правила и вопрос на год"]);
  });
});
