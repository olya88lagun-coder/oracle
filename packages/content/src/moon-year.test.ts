import { describe, expect, test } from "vitest";
import { PHASE_TEXTS } from "./moon";
import { checkMoonExtraTexts, FULL_MOON_QUESTIONS, KEY_POINT_ASTRONOMY, keyPointQuestion, MONTH_FAQ_EXTRA, MOON_EXTRA_TEXTS_ACCEPTED, monthSummary, NEW_MOON_QUESTIONS, PHASES_FAQ, SIGN_SYMBOLS, yearFaq, yearIntro } from "./moon-year";

const item = (label: string, signLocative: string) => ({ label, signLocative });

describe("month summary", () => {
  test("names the dates and the signs of the new and full moon and counts the sign changes", () => {
    const text = monthSummary({ monthLocative: "ноябре", year: 2026, new: [item("9 ноября, 10:02", "в Скорпионе")], full: [item("24 ноября, 17:53", "в Тельце")], signChanges: 12 });
    expect(text).toContain("новолуние — 9 ноября, 10:02 (в этот момент Луна в Скорпионе)");
    expect(text).toContain("полнолуние — 24 ноября, 17:53 (в этот момент Луна в Тельце)");
    expect(text).toContain("12 раз");
  });

  test("a month with two full moons lists both, and a missing event is not invented", () => {
    const text = monthSummary({ monthLocative: "мае", year: 2026, new: [item("16 мая, 23:01", "в Тельце")], full: [item("1 мая, 20:23", "в Скорпионе"), item("31 мая, 11:45", "в Стрельце")], signChanges: 13 });
    expect(text).toContain("1 мая, 20:23 (в этот момент Луна в Скорпионе) и 31 мая, 11:45 (в этот момент Луна в Стрельце)");
    const noNew = monthSummary({ monthLocative: "феврале", year: 2027, new: [], full: [item("20 февраля, 10:00", "в Деве")], signChanges: 12 });
    expect(noNew).not.toContain("новолуние —");
  });
});

describe("year pages", () => {
  const events = [
    { label: "3 января, 13:03", super: true },
    { label: "1 февраля, 01:09", super: false },
  ];

  test("the how-many question names the year and lists every date", () => {
    const [first] = yearFaq({ year: 2026, kind: "new", events, supermoonKm: 360_000 });
    expect(first!.question).toBe("Сколько новолуний в 2026 году?");
    expect(first!.answer).toContain("2 новолуний: 3 января, 13:03; 1 февраля, 01:09.");
    expect(first!.answer).toContain("1 февраля, 01:09");
  });

  test("only the full moon page explains the supermoon, with the threshold and the supermoon dates", () => {
    expect(yearFaq({ year: 2026, kind: "new", events, supermoonKm: 360_000 }).some((item) => item.question === "Что такое суперлуние?")).toBe(false);
    const answer = yearFaq({ year: 2026, kind: "full", events, supermoonKm: 360_000 }).find((item) => item.question === "Что такое суперлуние?")!.answer;
    expect(answer).toContain("3 января, 13:03");
    expect(answer).not.toContain("1 февраля");
    expect(answer).toMatch(/360\s?000 км/);
    expect(yearFaq({ year: 2026, kind: "full", events: [events[1]!], supermoonKm: 360_000 }).find((item) => item.question === "Что такое суперлуние?")!.answer).toContain("таких полнолуний нет");
  });

  test("each intro names the year", () => {
    expect(yearIntro("new", 2027)).toContain("2027");
    expect(yearIntro("full", 2027)).toContain("2027");
  });
});

describe("key points of the month", () => {
  const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const;

  test("every sign has an image line and a question for the new moon and for the full moon, and no two questions repeat", () => {
    for (const sign of SIGNS) {
      expect(SIGN_SYMBOLS[sign], sign).toBeTruthy();
      expect(NEW_MOON_QUESTIONS[sign], sign).toMatch(/\?$/);
      expect(FULL_MOON_QUESTIONS[sign], sign).toMatch(/\?$/);
    }
    const all = [...Object.values(NEW_MOON_QUESTIONS), ...Object.values(FULL_MOON_QUESTIONS)];
    expect(new Set(all).size).toBe(24);
  });

  test("the quarters take their question from the phase texts, new and full moon from the sign", () => {
    expect(keyPointQuestion("firstQuarter", "aries")).toBe(PHASE_TEXTS.find((entry) => entry.phase === "firstQuarter")!.question);
    expect(keyPointQuestion("lastQuarter", "leo")).toBe(PHASE_TEXTS.find((entry) => entry.phase === "lastQuarter")!.question);
    expect(keyPointQuestion("new", "scorpio")).toBe(NEW_MOON_QUESTIONS.scorpio);
    expect(keyPointQuestion("full", "gemini")).toBe(FULL_MOON_QUESTIONS.gemini);
  });

  test("the astronomy line is right about the quarters: a quarter of the cycle at the first, three quarters at the last", () => {
    expect(KEY_POINT_ASTRONOMY.firstQuarter).toContain("четверть лунного цикла");
    expect(KEY_POINT_ASTRONOMY.firstQuarter).not.toContain("Половина лунного цикла");
    expect(KEY_POINT_ASTRONOMY.lastQuarter).toContain("три четверти");
  });

  test("the extra month questions say the calendar does not rate days, that the matrix does not depend on the Moon, and what is stored", () => {
    expect(MONTH_FAQ_EXTRA).toHaveLength(3);
    const text = MONTH_FAQ_EXTRA.map((item) => `${item.question} ${item.answer}`).join(" ");
    expect(text).toContain("только по дате рождения");
    expect(text).toContain("остаются в вашем браузере");
    expect(text).toContain("политике обработки данных");
    expect(text).not.toMatch(/чистый лист|только вашу дату/);
  });
});

describe("checks", () => {
  test("no text contains a forbidden word", () => {
    expect(checkMoonExtraTexts()).toEqual([]);
  });

  test("the phases page answers three questions", () => {
    expect(PHASES_FAQ).toHaveLength(3);
  });

  test("the owner accepted the texts on 20 Nov 2026, so the pages show them", () => {
    expect(MOON_EXTRA_TEXTS_ACCEPTED).toBe(true);
  });
});
