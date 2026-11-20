import { moonMonth } from "@oracle/core/moon";
import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { keyPointsOf } from "@/lib/lunar-calendar";
import { MoonKeyPoints } from "./MoonKeyPoints";
import { MoonMonthDays } from "./MoonMonthDays";

const november = keyPointsOf(moonMonth(2026, 11).events, true);

describe("keyPointsOf", () => {
  test("November 2026: last quarter in Leo, new moon in Scorpio, first quarter in Aquarius, full moon in Gemini, with the Moscow times", () => {
    expect(november.map((point) => [point.kind, point.label, point.signLocative])).toEqual([
      ["lastQuarter", "1 ноября, 23:28", "во Льве"],
      ["new", "9 ноября, 10:02", "в Скорпионе"],
      ["firstQuarter", "17 ноября, 14:48", "в Водолее"],
      ["full", "24 ноября, 17:54", "в Близнецах"],
    ]);
  });

  test("only the new and the full moon carry the link to the spread", () => {
    expect(november.filter((point) => point.action).map((point) => point.kind)).toEqual(["new", "full"]);
    expect(november.find((point) => point.kind === "new")!.action!.href).toBe("/taro/rasklady/novolunie");
  });

  test("the question of the new moon and of the full moon depends on the sign, so the months differ", () => {
    const december = keyPointsOf(moonMonth(2026, 12).events, true);
    const questions = (points: typeof november, kind: string) => points.filter((point) => point.kind === kind).map((point) => point.question);
    expect(questions(november, "new")).not.toEqual(questions(december, "new"));
  });

  test("nothing is built while the owner has not accepted the texts", () => {
    expect(keyPointsOf(moonMonth(2026, 11).events, false)).toEqual([]);
  });
});

describe("MoonKeyPoints", () => {
  test("shows each key point with astronomy, symbolism and a question, and no ratings of days", () => {
    const html = renderToStaticMarkup(<MoonKeyPoints items={november} />);
    expect(html).toContain("Ключевые точки месяца для самонаблюдения");
    expect(html.match(/<li class="moon-keypoints__item"/g)).toHaveLength(4);
    expect(html.match(/<dt>Астрономия<\/dt>/g)).toHaveLength(4);
    expect(html.match(/<dt>Вопрос для размышления<\/dt>/g)).toHaveLength(4);
    expect(html).toContain("Луна в Скорпионе");
    expect(html.match(/moon-events__action/g)).toHaveLength(2);
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
  });

  test("every key point shows the engraving of the Moon's sign as a decorative picture", () => {
    expect(november.map((point) => point.signImage)).toEqual(["/luna/signs/leo-480.webp", "/luna/signs/scorpio-480.webp", "/luna/signs/aquarius-480.webp", "/luna/signs/gemini-480.webp"]);
    const html = renderToStaticMarkup(<MoonKeyPoints items={november} />);
    expect(html.match(/class="moon-sign-art"/g)).toHaveLength(4);
    expect(html).toContain("/luna/signs/scorpio-480.webp");
    expect(html.match(/alt=""/g)).toHaveLength(4);
  });

  test("renders nothing without key points", () => {
    expect(renderToStaticMarkup(<MoonKeyPoints items={[]} />)).toBe("");
  });
});

describe("MoonMonthDays guide", () => {
  const rows = [{ date: "2026-11-01", label: "1 ноября", phaseName: "Убывающая Луна", percent: 51, lunar: "22-е", signName: "Лев", riseSet: "21:00 / 11:00" }];

  test("shows the guide above the table only when it is given", () => {
    expect(renderToStaticMarkup(<MoonMonthDays rows={rows} />)).not.toContain("moon-days__guide");
    const html = renderToStaticMarkup(<MoonMonthDays rows={rows} guide={{ intro: "Вступление.", items: ["Первое.", "Второе."] }} />);
    expect(html).toContain("moon-days__guide");
    expect(html.indexOf("moon-days__guide")).toBeLessThan(html.indexOf("<table"));
    expect(html.match(/<li>/g)).toHaveLength(2);
  });
});
