import { computeNatalChart } from "@oracle/core/natal";
import type { StoredNatalChapter } from "@oracle/db";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { DISCLAIMER } from "@/lib/legal";
import { NatalReportView } from "./NatalReportView";

const CHAPTERS: StoredNatalChapter[] = [
  { id: "scenario", source: "fallback", scenario: { pattern: "Паттерн-текст.", tension: "Напряжение-текст.", resource: "Ресурс-текст.", blindSpot: "Слепая-текст.", turningPoint: "Точка-текст.", experiment: "Эксперимент-текст.", question: "Вопрос-текст?" } },
  { id: "mind", source: "fallback", paragraphs: ["Абзац про мышление."] },
  { id: "core", source: "fallback", paragraphs: ["Первый абзац ядра.", "Второй абзац ядра."] },
];

describe("NatalReportView", () => {
  const markup = renderToStaticMarkup(<NatalReportView chapters={CHAPTERS} date="1990-03-07" placeName="Москва" />);

  test("has one h1, the date and the place, and the disclaimer", () => {
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("по дате 07.03.1990, Москва");
    expect(markup).toContain(DISCLAIMER);
    expect(markup).toContain('href="/portret"');
  });

  test("lists the chapters in the fixed order whatever the order they were stored in", () => {
    const order = ["Ядро", "Мышление и общение", "Ваш сценарий"].map((title) => markup.indexOf(`>${title}</h2>`));
    expect(order.every((position) => position > 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(markup).toContain("Глава 3");
  });

  test("shows the paragraphs and the seven scenario fields", () => {
    expect(markup).toContain("Второй абзац ядра.");
    for (const field of ["Паттерн-текст.", "Напряжение-текст.", "Ресурс-текст.", "Слепая-текст.", "Точка-текст.", "Эксперимент-текст.", "Вопрос-текст?"]) expect(markup).toContain(field);
  });

  test("works without a place", () => {
    expect(renderToStaticMarkup(<NatalReportView chapters={CHAPTERS} date="1990-03-07" placeName={null} />)).toContain("по дате 07.03.1990</p>");
  });
});

describe("NatalReportView as a demo", () => {
  const demo = renderToStaticMarkup(<NatalReportView demo chapters={CHAPTERS} date="1990-03-07" placeName="Москва" />);

  test("is titled as an example, says the data are made up and keeps one h1", () => {
    expect(demo.match(/<h1/g)).toHaveLength(1);
    expect(demo).toContain("Пример разбора натальной карты");
    expect(demo).toContain("Демонстрационные данные: 07.03.1990, Москва");
    expect(demo).toContain("Пример не использует вашу дату");
  });

  test("leads to the calculator instead of the portrait", () => {
    expect(demo).not.toContain('href="/portret"');
    expect(demo).toContain('href="/natalnaya-karta"');
    expect(demo).toContain("Рассчитать свою карту");
  });

  test("still shows the chapters, the scenario and the disclaimer", () => {
    expect(demo).toContain("Второй абзац ядра.");
    expect(demo).toContain("Эксперимент-текст.");
    expect(demo).toContain(DISCLAIMER);
  });
});

describe("NatalReportView with the chart", () => {
  const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
  const chartData = { chart, birth: { city: "Москва", date: "1990-03-07", time: "12:00" } };
  const chapters: StoredNatalChapter[] = [
    { id: "core", source: "fallback", paragraphs: ["Вводный абзац ядра.", "Средний абзац ядра.", "Итоговый абзац ядра."] },
    { id: "love", source: "fallback", paragraphs: ["Единственный абзац любви.", "Второй абзац любви."] },
    { id: "work", source: "fallback", paragraphs: ["Про дело."] },
    { id: "aspects", source: "fallback", paragraphs: ["Про аспекты."] },
    { id: "scenario", source: "fallback", scenario: { pattern: "П.", tension: "Н.", resource: "Р.", blindSpot: "С.", turningPoint: "Т.", experiment: "Э.", question: "В?" } },
  ];
  const markup = renderToStaticMarkup(<NatalReportView chapters={chapters} date="1990-03-07" placeName="Москва" chartData={chartData} />);

  test("opens with the wheel of this chart, the glyph sprite and the three main positions", () => {
    expect(markup).toContain("natal-report__cover");
    expect(markup).toContain("natal-sprite");
    expect(markup).toContain("natal-wheel");
    expect(markup).toMatch(/natal-report__big-three[^>]*>.*Солнце (в|во) [А-Яа-я]+.*Луна (в|во) [А-Яа-я]+.*Асцендент (в|во) [А-Яа-я]+/s);
  });

  test("lists the positions of each chapter, and the houses of the chapters that have only houses", () => {
    expect(markup).toMatch(/natal-report__placement[^>]*>.*Венера (в|во) [А-Яа-я]+, \d+ дом/s);
    expect(markup).toContain("Дома 2, 6 и 10");
    expect(markup.match(/natal-report__placements/g)).toHaveLength(3);
  });

  test("marks the first paragraph of a chapter as the lead and the last one as the takeaway only when there are three or more", () => {
    expect(markup).toMatch(/natal-report__lead[^>]*>Вводный абзац ядра\./);
    expect(markup).toMatch(/natal-report__takeaway[^>]*>Итоговый абзац ядра\./);
    expect(markup.match(/natal-report__takeaway/g)).toHaveLength(1);
    expect(markup).toMatch(/natal-report__lead[^>]*>Единственный абзац любви\./);
  });

  test("wraps the scenario fields in natal-report__scenario and keeps one h1", () => {
    expect(markup).toMatch(/natal-report__scenario[^>]*><div class="report-scenario"/);
    expect(markup.match(/<h1/g)).toHaveLength(1);
  });

  test("without the chart (birth data deleted) it shows the same text, without the wheel and the positions", () => {
    const plain = renderToStaticMarkup(<NatalReportView chapters={chapters} date="1990-03-07" placeName={null} chartData={null} />);
    expect(plain).not.toContain("natal-report__cover");
    expect(plain).not.toContain("natal-report__placements");
    expect(plain).toContain("Единственный абзац любви.");
  });
});
