import type { City } from "@oracle/geo";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { describeCities, type CityState } from "@/lib/natal-cities";
import { CityField, CityFieldView } from "./CityField";

const city = (patch: Partial<City> & Pick<City, "id" | "name">): City => ({ region: "Ростовская область", country: "Россия", latitude: 47.23, longitude: 39.72, zone: "Europe/Moscow", population: 0, ...patch });
const ROSTOV_DON = city({ id: 1, name: "Ростов-на-Дону", population: 1_100_000 });
const ROSTOV_YAR = city({ id: 2, name: "Ростов", region: "Ярославская область", population: 31_000 });

const BASE = "t";
type ViewOverrides = Partial<Parameters<typeof CityFieldView>[0]>;
function view(overrides: ViewOverrides = {}): string {
  const state: CityState = overrides.state ?? { status: "idle" };
  const options = overrides.options ?? (state.status === "results" ? describeCities(state.cities) : []);
  return renderToStaticMarkup(<CityFieldView baseId={BASE} value="" state={state} open={false} options={options} activeIndex={-1} error={null} {...overrides} />);
}

const results = (cities: City[]): CityState => ({ status: "results", cities });

describe("CityFieldView: closed list (state 1)", () => {
  const markup = view();

  test("is the combobox of the mockup", () => {
    expect(markup).toContain('<label for="t-input">Место рождения</label>');
    expect(markup).toContain('class="natal-city__input"');
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-autocomplete="list"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls="t-list"');
    expect(markup).toContain('aria-describedby="t-help"');
    expect(markup).toContain('placeholder="Начните вводить город"');
    expect(markup).not.toContain("aria-activedescendant");
    expect(markup).not.toContain("aria-invalid");
  });

  test("the list is an empty hidden listbox with a label, followed by the hint", () => {
    expect(markup).toContain('<ul class="natal-city__list" id="t-list" role="listbox" aria-label="Города" hidden=""></ul>');
    expect(markup.indexOf("</ul>")).toBeLessThan(markup.indexOf('<p class="natal-field__help" id="t-help">'));
    expect(markup).toContain('<p class="natal-field__help" id="t-help">Нет вашего города? Выберите ближайший крупный: часовой пояс и долгота почти не изменятся.</p>');
  });

  test("keeps a live region for the number of matches, empty while closed", () => {
    expect(markup).toContain('<p class="sr-only" role="status" aria-live="polite"></p>');
  });

  test("has a visible label for the input", () => {
    expect(markup).toMatch(/<label for="t-input">[^<]+<\/label><input[^>]*id="t-input"/);
  });
});

describe("CityFieldView: options (state 2)", () => {
  const state = results([ROSTOV_DON, ROSTOV_YAR]);
  const markup = view({ state, open: true, activeIndex: 0, value: "ростов на" });

  test("opens the list and points aria-activedescendant at the highlighted option", () => {
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('aria-activedescendant="t-option-0"');
    expect(markup).toContain('value="ростов на"');
    expect(markup).not.toContain('hidden=""');
  });

  test("renders li.natal-city__option[role=option] with the marker and the region line", () => {
    expect(markup).toContain(
      '<li class="natal-city__option" id="t-option-0" role="option" aria-selected="true"><span class="natal-city__marker" aria-hidden="true">✓</span><span>Ростов-на-Дону<span class="natal-city__region">Ростовская область, Россия</span></span></li>',
    );
    expect(markup).toContain(
      '<li class="natal-city__option" id="t-option-1" role="option" aria-selected="false"><span class="natal-city__marker" aria-hidden="true"></span><span>Ростов<span class="natal-city__region">Ярославская область, Россия</span></span></li>',
    );
  });

  test("announces the number of matches", () => {
    expect(markup).toContain('<p class="sr-only" role="status" aria-live="polite">Найдено: 2</p>');
  });

  test("options are not tab stops: focus stays in the input", () => {
    expect(markup).not.toContain("tabindex");
  });

  test("the second option can be the highlighted one", () => {
    const second = view({ state, open: true, activeIndex: 1 });
    expect(second).toContain('aria-activedescendant="t-option-1"');
    expect(second).toContain('id="t-option-0" role="option" aria-selected="false"');
    expect(second).toContain('id="t-option-1" role="option" aria-selected="true"');
  });

  test("stays closed after Escape although the answer is still there", () => {
    const closed = view({ state, open: false, activeIndex: 0 });
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain('hidden=""');
    expect(closed).not.toContain("natal-city__option");
    expect(closed).not.toContain("aria-activedescendant");
  });
});

describe("CityFieldView: homonyms", () => {
  test("tells equal names apart with the population, and leaves unique ones as they are", () => {
    const state = results([city({ id: 10, name: "Заречное", population: 12_345 }), city({ id: 11, name: "Заречное", population: 800 }), ROSTOV_DON]);
    const markup = view({ state, open: true, activeIndex: 0 });
    expect(markup).toContain('<span class="natal-city__region">Ростовская область, Россия · 12 345 жителей</span>');
    expect(markup).toContain('<span class="natal-city__region">Ростовская область, Россия · 800 жителей</span>');
    expect(markup).toContain('<span class="natal-city__region">Ростовская область, Россия</span></span></li>');
  });

  test("falls back to coordinates when the population is unknown", () => {
    const state = results([city({ id: 10, name: "Заречное", latitude: 55.75, longitude: 37.62 }), city({ id: 11, name: "Заречное", latitude: 54.1, longitude: 61.5 })]);
    const markup = view({ state, open: true, activeIndex: 0 });
    expect(markup).toContain("Ростовская область, Россия · 55.75° с. ш., 37.62° в. д.");
    expect(markup).toContain("Ростовская область, Россия · 54.10° с. ш., 61.50° в. д.");
  });
});

describe("CityFieldView: nothing found (state 3)", () => {
  const markup = view({ state: { status: "empty" }, open: true, value: "Несуществующий город" });

  test("shows the empty row in an expanded listbox", () => {
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('<li role="presentation"><p class="natal-city__empty">Такого города не нашлось. Попробуйте другое написание или ближайший крупный город.</p></li>');
    expect(markup).not.toContain("natal-city__option");
  });

  test("has no active descendant and announces that nothing was found", () => {
    expect(markup).not.toContain("aria-activedescendant");
    expect(markup).toContain('aria-live="polite">Найдено: 0</p>');
  });
});

describe("CityFieldView: search failed (state 4)", () => {
  const markup = view({ state: { status: "error" }, open: true, value: "Москва" });

  test("shows the error row with role=alert", () => {
    expect(markup).toContain(
      '<li role="presentation"><p class="natal-city__error" role="alert">Не удалось загрузить список городов. Проверьте соединение и попробуйте ещё раз.</p></li>',
    );
    expect(markup).toContain('aria-expanded="true"');
  });
});

describe("CityFieldView: loading and idle", () => {
  test("keep the list closed and silent", () => {
    for (const status of ["idle", "loading"] as const) {
      const markup = view({ state: { status }, open: true, value: "Моск" });
      expect(markup).toContain('aria-expanded="false"');
      expect(markup).toContain('hidden=""');
      expect(markup).toContain('aria-live="polite"></p>');
    }
  });
});

describe("CityFieldView: field error (state 5)", () => {
  const markup = view({ error: "Выберите город из списка", value: "Москва" });

  test("marks the input invalid and ties the message to it, after the list and before the hint", () => {
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="t-help t-error"');
    expect(markup).toContain('<p class="natal-field__error" id="t-error" role="alert">Выберите город из списка</p>');
    expect(markup.startsWith('<div class="natal-field natal-city natal-field--error">')).toBe(true);
    expect(markup.indexOf("</ul>")).toBeLessThan(markup.indexOf('id="t-error"'));
    expect(markup.indexOf('id="t-error"')).toBeLessThan(markup.indexOf('id="t-help"'));
  });
});

describe("CityField (stateful)", () => {
  test("renders the closed combobox on the server, with the text it was given", () => {
    const markup = renderToStaticMarkup(<CityField value="Москва" selected={null} error={null} onTextChange={() => undefined} onSelect={() => undefined} />);
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('value="Москва"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('hidden=""');
  });
});
