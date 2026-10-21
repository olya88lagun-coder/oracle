import { TAROT_CARDS } from "@oracle/content/tarot";
import { describe, expect, test } from "vitest";
import { pickDistinctIndexes, positionReading, SPREADS_HUB_FAQ, spreadFromParam, spreadPath, TARO_SPREADS, type SpreadSource } from "./taro-spreads";

const SOURCES: readonly SpreadSource[] = ["essence", "love", "money", "resource", "distortion", "day", "action", "question"];
const PROMISES = /точн(ый|ое|ого) (прогноз|ответ)|гарантир|узнаете будущее|предскажет|покажет, что будет/i;
const allCopy = () => [
  ...TARO_SPREADS.flatMap((spread) => [spread.name, spread.title, spread.description, spread.teaser, spread.lead, ...spread.positions.flatMap((p) => [p.title, p.hint]), ...spread.faq.flatMap((f) => [f.question, f.answer])]),
  ...SPREADS_HUB_FAQ.flatMap((f) => [f.question, f.answer]),
];

describe("taro spreads", () => {
  test("has five spreads with unique slugs and from three to five positions each", () => {
    expect(TARO_SPREADS.map((spread) => spread.slug)).toEqual(["tri-karty", "otnosheniya", "vybor", "delo-i-dengi", "na-segodnya"]);
    expect(new Set(TARO_SPREADS.map((spread) => spread.slug)).size).toBe(TARO_SPREADS.length);
    for (const spread of TARO_SPREADS) {
      expect(spread.positions.length).toBeGreaterThanOrEqual(3);
      expect(spread.positions.length).toBeLessThanOrEqual(5);
      for (const position of spread.positions) expect(SOURCES).toContain(position.source);
    }
  });

  test("every spread has its own short title, a snippet-sized description, a lead and at least two FAQ items", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const spread of TARO_SPREADS) {
      expect(spread.title.length).toBeLessThanOrEqual(60);
      expect(spread.description.length).toBeGreaterThan(100);
      expect(spread.description.length).toBeLessThanOrEqual(160);
      expect(spread.lead.length).toBeGreaterThan(60);
      expect(spread.faq.length).toBeGreaterThanOrEqual(2);
      titles.add(spread.title);
      descriptions.add(spread.description);
    }
    expect(titles.size).toBe(TARO_SPREADS.length);
    expect(descriptions.size).toBe(TARO_SPREADS.length);
  });

  test("every spread has a short name for the tiles on /taro", () => {
    expect(TARO_SPREADS.map((spread) => spread.short)).toEqual(["Три карты", "Отношения", "Выбор из двух", "Дело и деньги", "На сегодня"]);
    for (const spread of TARO_SPREADS) expect(spread.short.length).toBeLessThanOrEqual(24);
  });

  test("builds addresses under /taro/rasklady and resolves only exact slugs", () => {
    expect(spreadPath(TARO_SPREADS[0]!)).toBe("/taro/rasklady/tri-karty");
    expect(spreadFromParam("otnosheniya")?.name).toBe("Расклад на отношения");
    for (const bad of ["net", "Tri-karty", "tri-karty/", "", "karta-dnya"]) expect(spreadFromParam(bad)).toBeNull();
  });

  test("every position source gives readable text for all 78 cards", () => {
    expect(TAROT_CARDS).toHaveLength(78);
    for (const card of TAROT_CARDS) {
      for (const source of SOURCES) {
        const reading = positionReading(card, source);
        expect(reading.lines.length, `${card.slug} ${source}`).toBeGreaterThan(0);
        for (const line of reading.lines) expect(line.trim().length, `${card.slug} ${source}`).toBeGreaterThan(10);
        expect(reading.list).toBe(source === "resource" || source === "distortion");
      }
    }
  });

  test("a position shows the part of the card that matches it, not the whole card", () => {
    const mag = TAROT_CARDS.find((card) => card.slug === "mag")!;
    expect(positionReading(mag, "essence").lines).toEqual([mag.essence[1]]);
    expect(positionReading(mag, "love").lines).toEqual([mag.love[0]]);
    expect(positionReading(mag, "resource").lines).toEqual([...mag.resource]);
    expect(positionReading(mag, "action").lines).toEqual([mag.action]);
    expect(positionReading(mag, "question").lines).toEqual([mag.question]);
  });

  test("draws distinct in-range cards and covers the whole deck without repeats", () => {
    let calls = 0;
    const picked = pickDistinctIndexes(5, 78, () => (calls++ * 0x0333_3333) % 0x1_0000_0000);
    expect(picked).toHaveLength(5);
    expect(new Set(picked).size).toBe(5);
    for (const index of picked) expect(index).toBeGreaterThanOrEqual(0);
    for (const index of picked) expect(index).toBeLessThan(78);
    const all = pickDistinctIndexes(78, 78);
    expect([...all].sort((a, b) => a - b)).toEqual(Array.from({ length: 78 }, (_, index) => index));
    expect(() => pickDistinctIndexes(79, 78)).toThrow();
  });

  test("the hub FAQ answers «гадание» and «да или нет» honestly", () => {
    expect(SPREADS_HUB_FAQ.length).toBeGreaterThanOrEqual(7);
    const reading = SPREADS_HUB_FAQ.find((item) => /гадание/i.test(item.question));
    expect(reading?.answer).toMatch(/не обещаем/);
    const yesNo = SPREADS_HUB_FAQ.find((item) => /да или нет/i.test(item.question));
    expect(yesNo?.answer).toMatch(/не обещаем предсказаний/);
  });

  test("no copy promises a prediction", () => {
    for (const text of allCopy()) expect(text).not.toMatch(PROMISES);
  });
});
