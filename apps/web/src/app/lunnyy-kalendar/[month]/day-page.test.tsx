import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bridgeCopy } from "@/lib/moon-natal-bridge";
import Page, { generateMetadata } from "./page";

const params = (month: string) => ({ params: Promise.resolve({ month }) });
const render = async (slug = "24-noyabrya-2026") => renderToStaticMarkup(await Page(params(slug)));
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;
const visibleText = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-17T09:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("the page of 24 November 2026", () => {
  test("has one h1, answers in the first paragraph and names the place and the weekday", async () => {
    const html = await render();
    expect(count(html, /<h1/g)).toBe(1);
    expect(html).toContain("<h1>Луна 24 ноября 2026: полнолуние, 15-е лунные сутки</h1>");
    expect(html).toContain("По Москве");
    expect(html).toContain("вторник");
    expect(html).toContain("24 ноября 2026 — полнолуние в 17:54.");
  });

  test("shows the day: the events, four tiles with the numbers, the rise and the set", async () => {
    const html = await render();
    expect(count(html, /class="moon-tile"/g)).toBe(4);
    for (const part of ["17:54", "15:12", "08:32", "Близнецы", "Полнолуние", "Начинаются 16-е лунные сутки"]) expect(html, part).toContain(part);
    expect(count(html, /class="moon-date-event( |")/g)).toBe(3);
  });

  test("shows seven neighbours, one of them current, and links the days around and the month", async () => {
    const html = await render();
    expect(count(html, /class="moon-date-days__item/g)).toBe(7);
    expect(count(html, /aria-current="date"/g)).toBe(1);
    for (const href of ["/lunnyy-kalendar/23-noyabrya-2026", "/lunnyy-kalendar/25-noyabrya-2026", "/lunnyy-kalendar/noyabr-2026", "/luna/sutki/15"]) expect(html, href).toContain(`href="${href}"`);
  });

  test("carries the texts of the day and of the phase, the bridge to the natal chart and three questions", async () => {
    const html = await render();
    expect(html).toContain("Что описывает этот день");
    expect(html).toContain('data-from="day"');
    expect(html).toContain("Узнать свою Луну");
    expect(count(html, /<details/g)).toBe(3);
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  test("has no words of evaluation and no mention of a chosen city", async () => {
    const text = visibleText(await render());
    for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
    expect(text).not.toContain("для города");
  });

  test("has its own canonical address, a title with the date and the engraving of the phase as the preview", async () => {
    const metadata = await generateMetadata(params("24-noyabrya-2026"));
    expect(String(metadata.title)).toContain("24 ноября 2026");
    expect(metadata.alternates?.canonical).toContain("/lunnyy-kalendar/24-noyabrya-2026");
    expect(JSON.stringify(metadata.openGraph?.images)).toContain("/luna/phases/");
  });
});

describe("the details of the page", () => {
  test("a day without events says so under a plural heading", async () => {
    const html = await render("2-noyabrya-2026");
    expect(html).toContain("Главных фаз и входа Луны в новый знак в этот день нет.");
    expect(html).not.toContain("Событие дня");
  });

  test("the breadcrumb list of the markup has the month between the section and the day", async () => {
    const html = await render();
    expect(html).toContain('"name":"Ноябрь 2026"');
    expect(html).toContain('"position":4');
  });

  test("a neighbour is announced by its full date and light, not by dots and digits", async () => {
    const html = await render();
    expect(html).toContain('aria-label="24 ноября, освещено 100 %"');
  });

  test("the sign tile does not repeat itself when the Moon enters the sign before noon", async () => {
    const html = await render("26-oktyabrya-2026");
    expect(html).not.toMatch(/Телец<\/span><span class="moon-tile__note">в \d\d:\d\d — Телец/);
  });
});

describe("the neighbours of the window", () => {
  test("the first day has no link to the day before", async () => {
    const html = await render("1-oktyabrya-2026");
    expect(html).not.toContain('rel="prev"');
    expect(html).toContain('rel="next"');
    expect(html).toContain('href="/lunnyy-kalendar/2-oktyabrya-2026"');
  });

  test("the last day of a year leads to the first day of the next one", async () => {
    const html = await render("31-dekabrya-2026");
    expect(html).toContain('href="/lunnyy-kalendar/1-yanvarya-2027"');
  });
});

describe("addresses that are not pages", () => {
  test("mixed, impossible and outside-the-window slugs are a real 404, and the month page still opens", async () => {
    for (const slug of ["31-noyabrya-2026", "24-noyabr-2026", "noyabrya-2026", "0-noyabrya-2026", "024-noyabrya-2026", "24-noyabrya-2020", "24-noyabrya-2028"]) {
      await expect(Page(params(slug)), slug).rejects.toMatchObject({ digest: expect.stringContaining("404") });
      await expect(generateMetadata(params(slug)), slug).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    }
    expect(await render("noyabr-2026")).toContain("Лунный календарь на ноябрь 2026");
  });
});

describe("the bridge for a day", () => {
  test("names the sign of the day and leads to the moon-sign page", () => {
    const copy = bridgeCopy("day", "в Тельце");
    expect(copy.text.startsWith("В этот день Луна в Тельце.")).toBe(true);
    expect(copy.cta).toBe("Узнать свою Луну");
    expect(copy.href).toBe(bridgeCopy("month").href);
  });
});
