import type { City } from "@oracle/geo";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { validateAll } from "@/lib/natal-input";
import { NatalCalculator } from "./NatalCalculator";
import { EMPTY_FORM_VALUES, NO_FORM_ERRORS, NatalForm, type NatalFormErrors, type NatalFormValues } from "./NatalForm";
import { NatalSprite } from "./NatalSprite";
import { cityNamed, readMockup } from "./sample-chart.test-support";

const MOSCOW: City = cityNamed("Москва");

// Атрибуты тегов <input> по имени поля: порядок атрибутов в разметке React не гарантирует, да он и не важен
function inputs(markup: string): Record<string, Record<string, string>> {
  const found: Record<string, Record<string, string>> = {};
  for (const tag of markup.matchAll(/<input\b([^>]*?)\/?>/g)) {
    const attrs = Object.fromEntries([...(tag[1] as string).matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]]));
    if (attrs.name) found[attrs.name] = attrs;
  }
  return found;
}

function form(values: Partial<NatalFormValues> = {}, errors: NatalFormErrors = NO_FORM_ERRORS, flags: { busy?: boolean; failed?: boolean } = {}): string {
  return renderToStaticMarkup(
    <NatalForm values={{ ...EMPTY_FORM_VALUES, ...values }} errors={errors} busy={flags.busy ?? false} failed={flags.failed ?? false} onChange={() => undefined} onSubmit={() => undefined} />,
  );
}

describe("NatalForm: empty (state 1)", () => {
  const markup = form();

  test("has labelled date, time and city fields with the texts of the mockup", () => {
    expect(markup).toMatch(/<form class="natal-form" aria-label="Данные рождения" novalidate="">/i);
    const fields = inputs(markup);
    expect(fields.date).toMatchObject({ type: "date", min: "1900-01-01", value: "" });
    expect(fields.time).toMatchObject({ type: "time", value: "" });
    expect(fields.city).toMatchObject({ type: "text", role: "combobox", placeholder: "Начните вводить город" });
    expect(markup).toContain(`<label for="${fields.date?.id}">Дата рождения</label>`);
    expect(markup).toContain(`<label for="${fields.time?.id}">Время рождения</label>`);
    expect(markup).toContain(`<label for="${fields.city?.id}">Место рождения</label>`);
    expect(markup).toContain('<label class="natal-unknown-time"><input type="checkbox" name="unknown-time"/><span>Время рождения неизвестно</span></label>');
  });

  test("does not put today's date in the markup: the upper bound is set after loading", () => {
    expect(markup).not.toMatch(/max=/);
  });

  test("the calculate button is disabled until a city is chosen, and the status is empty", () => {
    expect(markup).toContain('<button class="natal-button natal-button--calculate" type="submit" disabled="">Рассчитать карту</button>');
    expect(markup).toContain('<p class="natal-status" role="status" aria-live="polite"></p>');
  });

  test("ends with the privacy line", () => {
    expect(markup).toContain('<p class="natal-form__privacy">Считается в вашем браузере. Дата, время и место нигде не сохраняются, пока вы сами не нажмёте «Сохранить в портрет».</p>');
    expect(markup.endsWith("</form>")).toBe(true);
  });

  test("shows no errors and marks nothing invalid", () => {
    expect(markup).not.toContain("natal-field__error");
    expect(markup).not.toContain("aria-invalid");
    expect(markup).not.toContain("natal-form__error");
  });
});

describe("NatalForm: filled", () => {
  test("shows the values and enables the button once a city is chosen", () => {
    const markup = form({ date: "1990-03-07", time: "12:00", cityText: "Москва", city: MOSCOW });
    expect(markup).toContain('value="1990-03-07"');
    expect(markup).toContain('value="12:00"');
    expect(markup).toContain('value="Москва"');
    expect(markup).toContain('<button class="natal-button natal-button--calculate" type="submit">Рассчитать карту</button>');
  });

  test("unknown time disables the time field and shows it empty", () => {
    const markup = form({ date: "1990-03-07", time: "12:00", unknownTime: true, cityText: "Москва", city: MOSCOW });
    expect(inputs(markup).time).toMatchObject({ value: "", disabled: "" });
    expect(inputs(markup)["unknown-time"]).toMatchObject({ type: "checkbox", checked: "" });
  });
});

describe("NatalForm: field errors (state 5)", () => {
  const errors: NatalFormErrors = validateAll({ date: "", time: "", unknownTime: false, city: null }, new Date(2026, 9, 15));
  const markup = form({ cityText: "Москва" }, errors);

  test("shows all errors at once, each tied to its field", () => {
    expect(errors).toEqual({ date: "Укажите дату рождения", time: "Укажите время в формате ЧЧ:ММ", city: "Выберите город из списка" });
    expect(markup).toMatch(/<p class="natal-field__error" id="([^"]+)-date-error" role="alert">Укажите дату рождения<\/p>/);
    expect(markup).toMatch(/<p class="natal-field__error" id="([^"]+)-time-error" role="alert">Укажите время в формате ЧЧ:ММ<\/p>/);
    expect(markup).toContain('role="alert">Выберите город из списка</p>');
  });

  test("marks the date, time and city inputs invalid and describes them by the messages", () => {
    expect(markup.match(/aria-invalid="true"/g)).toHaveLength(3);
    const dateId = /id="([^"]+)-date-error"/.exec(markup)?.[1];
    expect(markup).toContain(`aria-describedby="${dateId}-date-error"`);
    expect(markup).toContain(`aria-describedby="${dateId}-time-error"`);
    expect(markup.match(/natal-field--error/g)).toHaveLength(3);
  });

  test("the time error stays between the time input and the unknown-time checkbox", () => {
    expect(markup.indexOf("-time-error")).toBeLessThan(markup.indexOf("natal-unknown-time"));
  });

  test("an unknown time has no time error", () => {
    const unknown = validateAll({ date: "1990-03-07", time: "", unknownTime: true, city: MOSCOW }, new Date(2026, 9, 15));
    expect(unknown.time).toBeNull();
  });
});

describe("NatalForm: calculating and failing", () => {
  test("shows «Считаем карту…» on the disabled button and in the status", () => {
    const markup = form({ date: "1990-03-07", time: "12:00", cityText: "Москва", city: MOSCOW }, NO_FORM_ERRORS, { busy: true });
    expect(markup).toContain('<button class="natal-button natal-button--calculate" type="submit" disabled="">Считаем карту…</button>');
    expect(markup).toContain('<p class="natal-status" role="status" aria-live="polite">Считаем карту…</p>');
  });

  test("shows the calculation error as an alert", () => {
    const markup = form({ cityText: "Москва", city: MOSCOW }, NO_FORM_ERRORS, { failed: true });
    expect(markup).toContain('<p class="natal-form__error" role="alert">Не получилось рассчитать карту. Проверьте данные и попробуйте ещё раз.</p>');
  });
});

describe("NatalCalculator at the first render", () => {
  const markup = renderToStaticMarkup(<NatalCalculator />);

  test("is the empty form and nothing else: no result, no notices, no sprite", () => {
    expect(markup.startsWith('<form class="natal-form"')).toBe(true);
    expect(markup.endsWith("</form>")).toBe(true);
    expect(markup).not.toContain("natal-result");
    expect(markup).not.toContain("natal-notice");
    expect(markup).not.toContain("natal-sprite");
    expect(markup).not.toContain("<h1");
  });

  test("has no way to leak the birth data before the person acts: no links, no hidden fields", () => {
    expect(markup).not.toMatch(/<a |type="hidden"|action=/);
  });
});

describe("NatalSprite", () => {
  const markup = renderToStaticMarkup(<NatalSprite />);
  const accepted = readMockup("natal-glyphs.svg");
  const symbols = (source: string) =>
    [...source.matchAll(/<symbol id="([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)].map((match) => ({
      id: match[1],
      viewBox: match[2],
      // React пишет <circle …></circle>, в файле — <circle …/>: для сравнения приводим к одному виду
      inner: (match[3] as string).replace(/<(\w+)([^>]*?)\s*><\/\1>/g, "<$1$2/>").replace(/\s*\/>/g, "/>"),
    }));

  test("takes no space and is hidden from assistive technology", () => {
    expect(markup).toMatch(/^<svg class="natal-sprite" aria-hidden="true" focusable="false" width="0" height="0">/);
  });

  test("holds the 24 symbols of the accepted glyph file, drawn the same", () => {
    const expected = symbols(accepted);
    expect(expected).toHaveLength(24);
    expect(symbols(markup)).toEqual(expected);
  });

  test("has every glyph the wheel, the table and the summary refer to", () => {
    const ids = symbols(markup).map((symbol) => symbol.id);
    for (const id of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "retro", "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]) {
      expect(ids).toContain(`glyph-${id}`);
    }
  });
});
