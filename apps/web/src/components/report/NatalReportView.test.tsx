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

