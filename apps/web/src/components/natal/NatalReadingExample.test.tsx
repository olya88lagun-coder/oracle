import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { formatDegrees, SIGN_NAMES } from "@/lib/natal-copy";
import { keyTextFor } from "@/lib/natal-texts";
import { realChart } from "./sample-chart.test-support";
import { NatalReadingExample } from "./NatalReadingExample";

describe("NatalReadingExample", () => {
  test("the public example agrees with a real calculation through the city and historical time-zone pipeline", () => {
    const chart = realChart("Москва", "1990-03-07", "12:25");
    const html = renderToStaticMarkup(<NatalReadingExample />);
    for (const body of ["sun", "moon"] as const) {
      const point = chart.points.find((item) => item.id === body)!;
      expect(html).toContain(formatDegrees(point.degree));
      expect(html).toContain(SIGN_NAMES[point.sign]);
      expect(html).toContain(`href="${keyTextFor(body, point.sign)!.href}"`);
    }
    expect(html).toContain(formatDegrees(chart.ascendant!.degree));
    expect(html).toContain(`href="${keyTextFor("ascendant", chart.ascendant!.sign)!.href}"`);
  });

  test("explains the example in initial HTML without claiming it is the visitor's result or replacing the form", () => {
    const html = renderToStaticMarkup(<NatalReadingExample />);
    expect(html).toMatch(/учебный пример/i);
    expect(html).toContain("12:25");
    expect(html).toContain("Это условные данные");
    expect(html).toContain("Как читать натальную карту");
    expect(html).toContain('href="/natalnaya-karta/primer"');
    expect(html).not.toMatch(/<input|<form|<details|<h1|Ваша натальная карта/);
  });
});
