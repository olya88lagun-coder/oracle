import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { PUBLIC_PATHS } from "@/lib/seo";

// Страница читает вход и портрет: без базы и cookies проверяем разметку гостя и то, что у вошедшего портрет запрашивается по его id
const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  loadPortrait: vi.fn(),
}));
vi.mock("@/server/viewer", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/server/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/profile-service", () => ({ loadPortrait: mocks.loadPortrait }));

const { default: NatalPage, metadata } = await import("./page");

describe("/natalnaya-karta page", () => {
  let markup = "";
  beforeAll(async () => {
    mocks.currentUser.mockResolvedValue(null);
    markup = renderToStaticMarkup(await NatalPage());
  });

  test("a guest does not trigger a portrait lookup", () => {
    expect(mocks.loadPortrait).not.toHaveBeenCalled();
  });

  test("a signed-in person gets the portrait of their own id and the same empty form", async () => {
    mocks.currentUser.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111", displayName: "Аня" });
    mocks.loadPortrait.mockResolvedValue({ birthDate: { year: 1990, month: 3, day: 7 }, time: "12:05", place: { name: "Москва", latitude: 55.75, longitude: 37.62, zone: "Europe/Moscow" } });

    const signedIn = renderToStaticMarkup(await NatalPage());

    expect(mocks.loadPortrait).toHaveBeenCalledWith(expect.anything(), "11111111-1111-4111-8111-111111111111");
    expect(signedIn).toBe(markup);
  });

  test("has one main and exactly one h1 with the intro under it", () => {
    expect(markup.match(/<main/g)).toHaveLength(1);
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('<header class="natal-intro"><h1>Натальная карта</h1><p>Дата, время и место рождения — и вы увидите, в каких знаках стояли Солнце, Луна и планеты. Это символический язык самопознания, а не предсказание.</p></header>');
  });

  test("puts the sprite once, then the calculator form, then the disclaimer", () => {
    expect(markup.match(/class="natal-sprite"/g)).toHaveLength(1);
    expect(markup.indexOf("natal-sprite")).toBeLessThan(markup.indexOf('class="natal-form"'));
    expect(markup.indexOf('class="natal-form"')).toBeLessThan(markup.indexOf("natal-disclaimer"));
    expect(markup).toContain('<p class="natal-disclaimer">Практики — инструмент самопознания, а не предсказание и не консультация.</p>');
    expect(markup.endsWith("</p></main>")).toBe(true);
  });

  test("is server-rendered as an empty form: no result yet", () => {
    expect(markup).not.toContain("natal-result");
    expect(markup).toContain("Рассчитать карту");
  });

  test("is closed to search engines until the practice is launched, but keeps its canonical address", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("/natalnaya-karta");
    expect(String(metadata.description)).not.toMatch(/предскажем|узнайте будущее|судьб/i);
  });

  test("is not added to the sitemap paths before launch", () => {
    expect(PUBLIC_PATHS).not.toContain("/natalnaya-karta");
  });
});
