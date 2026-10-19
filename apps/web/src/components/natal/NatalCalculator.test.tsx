import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { SavedBirth } from "@/lib/natal-save";
import { NatalCalculator } from "./NatalCalculator";

const SAVED: SavedBirth = { date: "1990-03-07", time: "12:05", place: { name: "Москва", latitude: 55.75, longitude: 37.62, zone: "Europe/Moscow" } };

// Подстановка из портрета и после входа идёт в эффектах: разметка сервера и первого кадра браузера не должна зависеть ни от входа, ни от портрета
describe("NatalCalculator first render", () => {
  const guest = renderToStaticMarkup(<NatalCalculator />);

  test("is the same for a guest, a signed-in person and a person with a saved portrait", () => {
    expect(renderToStaticMarkup(<NatalCalculator signedIn savedProfile={null} />)).toBe(guest);
    expect(renderToStaticMarkup(<NatalCalculator signedIn savedProfile={SAVED} />)).toBe(guest);
    expect(renderToStaticMarkup(<NatalCalculator signedIn savedProfile={{ ...SAVED, time: null, place: null }} />)).toBe(guest);
  });

  test("shows the form without a result and without the save block", () => {
    expect(guest).toContain('aria-label="Данные рождения"');
    expect(guest).not.toContain("Сохранить в портрет</button>");
    expect(guest).not.toContain("Войти и сохранить");
    expect(guest).not.toContain("natal-outcome");
  });

  test("keeps the privacy line verbatim", () => {
    expect(guest).toContain("Считается в вашем браузере. Дата, время и место нигде не сохраняются, пока вы сами не нажмёте «Сохранить в портрет».");
  });
});
