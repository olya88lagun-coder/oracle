import type { City } from "@oracle/geo";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { NatalInput } from "@/lib/natal-input";
import type { NatalSaveState } from "@/lib/natal-save";
import { SaveToPortrait } from "./SaveToPortrait";

const MOSCOW: City = { id: 1, name: "Москва", region: "", country: "Россия", latitude: 55.75, longitude: 37.62, zone: "Europe/Moscow", population: 1 };
const INPUT: NatalInput = { date: "1990-03-07", time: "12:00", city: MOSCOW };

const render = (state: NatalSaveState, replacesOther = false) =>
  renderToStaticMarkup(<SaveToPortrait state={state} input={INPUT} replacesOther={replacesOther} onSave={() => undefined} />);
const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const STATUS_EMPTY = '<p class="natal-save__status" role="status"></p>';

describe("SaveToPortrait", () => {
  test("guest: a login link back to the calculator, no button, no alert, an empty live region", () => {
    const markup = render("guest");

    expect(markup).toContain('<a class="natal-button natal-button--save" href="/login?next=%2Fnatalnaya-karta">Войти и сохранить</a>');
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain('role="alert"');
    expect(markup).toContain(STATUS_EMPTY);
  });

  test("the login link carries no birth data", () => {
    const markup = render("guest");

    for (const secret of ["1990", "12:00", "Москва", "Moscow", "55.75"]) expect(markup).not.toContain(secret);
  });

  test("offer: the «Сохранить в портрет» button and no note when nothing else is stored", () => {
    const markup = render("offer");

    expect(markup).toContain('<button type="button" class="natal-button natal-button--save">Сохранить в портрет</button>');
    expect(markup).not.toContain("natal-save__note");
    expect(markup).not.toContain("<a ");
    expect(markup).toContain(STATUS_EMPTY);
  });

  test("offer with other stored data: the note comes before the button", () => {
    const markup = render("offer", true);

    expect(markup).toContain('<p class="natal-save__note">В портрете сейчас другие данные рождения. Сохранить эти вместо них?</p>');
    expect(markup.indexOf("natal-save__note")).toBeLessThan(markup.indexOf("<button"));
  });

  test("the note is not shown in other states", () => {
    for (const state of ["guest", "saving", "saved", "error"] as const) expect(render(state, true)).not.toContain("natal-save__note");
  });

  test("saving: «Сохраняем…» in the live region and no button", () => {
    const markup = render("saving");

    expect(markup).toContain('<p class="natal-save__status" role="status">Сохраняем…</p>');
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("<a ");
  });

  test("saved: «Сохранено.» in the live region and a link to the portrait", () => {
    const markup = render("saved");

    expect(markup).toContain('<p class="natal-save__status" role="status">Сохранено.</p>');
    expect(markup).toContain('<a class="natal-save__link" href="/portret">Открыть портрет</a>');
    expect(markup).not.toContain("<button");
  });

  test("error: an alert with the message and the «Повторить» button", () => {
    const markup = render("error");

    expect(markup).toContain('<p class="natal-save__error" role="alert">Не получилось сохранить. Проверьте интернет и попробуйте ещё раз.</p>');
    expect(markup).toContain('<button type="button" class="natal-button natal-button--save">Повторить</button>');
    expect(text(markup)).not.toContain("Сохранено.");
  });

  test("has exactly one status region in every state and an alert only in the error state", () => {
    for (const state of ["guest", "offer", "saving", "saved", "error"] as const) {
      const markup = render(state);
      expect(markup.match(/role="status"/g)?.length, state).toBe(1);
      expect(markup.match(/role="alert"/g)?.length ?? 0, state).toBe(state === "error" ? 1 : 0);
    }
  });
});
