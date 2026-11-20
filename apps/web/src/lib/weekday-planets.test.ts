import { expect, test } from "vitest";
import { COMPAT_PATH } from "./compat";
import { THREAD_PATH } from "./life-thread";
import { PUBLIC_PATHS } from "./seo";
import { WEEKDAY_FAQ, WEEKDAY_PATH, WEEKDAY_PLANETS, weekdayIndex, weekdayPlanet } from "./weekday-planets";

test("seven days from Monday to Sunday with the classical planets", () => {
  expect(WEEKDAY_PLANETS.map((item) => item.planet)).toEqual(["Луна", "Марс", "Меркурий", "Юпитер", "Венера", "Сатурн", "Солнце"]);
  expect(WEEKDAY_PLANETS.map((item) => item.day)).toEqual(["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]);
  expect(new Set(WEEKDAY_PLANETS.map((item) => item.slug)).size).toBe(7);
});

test("weekday follows Moscow, not the server clock", () => {
  expect(weekdayIndex(new Date("2026-11-20T12:00:00+03:00"))).toBe(4); // пятница
  // 21:30 UTC в четверг — уже полночь пятницы по Москве
  expect(weekdayIndex(new Date("2026-11-19T21:30:00Z"))).toBe(4);
  expect(weekdayIndex(new Date("2026-11-19T20:30:00Z"))).toBe(3);
  expect(weekdayPlanet(new Date("2026-11-22T12:00:00+03:00")).planet).toBe("Солнце"); // воскресенье
  expect(weekdayPlanet(new Date("2026-11-23T12:00:00+03:00")).planet).toBe("Луна"); // понедельник
});

test("practice links lead to pages that exist and literals match the real paths", () => {
  const hrefs = WEEKDAY_PLANETS.map((item) => item.practice.href);
  expect(hrefs).toContain(COMPAT_PATH);
  expect(hrefs).toContain(THREAD_PATH);
  for (const href of hrefs) expect(PUBLIC_PATHS).toContain(href);
  expect(PUBLIC_PATHS).toContain(WEEKDAY_PATH);
});

test("texts promise no prediction and give no day ratings", () => {
  const text = [...WEEKDAY_PLANETS.flatMap((item) => [item.archetype, item.question, item.practice.lead]), ...WEEKDAY_FAQ.map((item) => item.answer)].join(" ").toLowerCase();
  for (const word of ["благоприятн", "неблагоприятн", "удачн", "гарантир", "обязательно произойд"]) expect(text).not.toContain(word);
});
