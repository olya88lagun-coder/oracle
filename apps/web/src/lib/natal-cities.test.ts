import type { City } from "@oracle/geo";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CITY_SEARCH_DELAY_MS, createCitySearch, describeCities, formatCoordinates, formatPopulation, navigateCityList, type CityState, type FetchLike } from "./natal-cities";

const city = (patch: Partial<City> & Pick<City, "id" | "name">): City => ({
  region: "Ростовская область",
  country: "Россия",
  latitude: 47.23,
  longitude: 39.72,
  zone: "Europe/Moscow",
  population: 0,
  ...patch,
});

const MOSCOW = city({ id: 1, name: "Москва", region: "", latitude: 55.75, longitude: 37.62, population: 12_600_000 });
const ROSTOV = city({ id: 2, name: "Ростов-на-Дону", population: 1_100_000 });

type Reply = { ok?: boolean; status?: number; body?: unknown };
const respond = ({ ok = true, status = 200, body = { cities: [] } }: Reply = {}) => ({ ok, status, json: async () => body });

// Запрос, который держит ответ, пока тест не вызовет resolve
function deferredFetch() {
  const calls: { url: string; signal: AbortSignal | undefined; resolve: (reply: Reply) => void; reject: (error: Error) => void }[] = [];
  const fetchImpl: FetchLike = (url, init) =>
    new Promise((resolve, reject) => {
      calls.push({ url, signal: init?.signal, resolve: (reply) => resolve(respond(reply)), reject });
    });
  return { fetchImpl, calls };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createCitySearch", () => {
  test("starts idle and sends no request for a query shorter than 2 or longer than 40 characters", async () => {
    const fetchImpl = vi.fn<FetchLike>();
    const search = createCitySearch({ fetchImpl });
    expect(search.getState()).toEqual({ status: "idle" });
    for (const query of ["", "м", "  м  ", "я".repeat(41)]) {
      search.search(query);
      await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS * 4);
      expect(search.getState()).toEqual({ status: "idle" });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("waits 250 ms, then asks /api/cities with the normalized, encoded query", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respond({ body: { cities: [MOSCOW] } }));
    const search = createCitySearch({ fetchImpl });
    search.search("  Ёлки-Палки  ");
    expect(search.getState()).toEqual({ status: "loading" });
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS - 1);
    expect(fetchImpl).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`/api/cities?q=${encodeURIComponent("елки палки")}`);
    expect(search.getState()).toEqual({ status: "results", cities: [MOSCOW] });
  });

  test("a burst of keystrokes makes one request, for the last text", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respond({ body: { cities: [ROSTOV] } }));
    const search = createCitySearch({ fetchImpl });
    for (const text of ["ро", "рос", "рост", "росто"]) {
      search.search(text);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toContain(encodeURIComponent("росто"));
  });

  test("a newer query aborts the request in flight and the stale response is never shown", async () => {
    const { fetchImpl, calls } = deferredFetch();
    const search = createCitySearch({ fetchImpl });
    const seen: CityState[] = [];
    search.subscribe((state) => seen.push(state));

    search.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(calls).toHaveLength(1);

    search.search("ростов");
    expect(calls[0]?.signal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(calls).toHaveLength(2);

    // Ответ на первый запрос приходит позже второго и не должен ничего менять
    calls[1]?.resolve({ body: { cities: [ROSTOV] } });
    await flush();
    calls[0]?.resolve({ body: { cities: [MOSCOW] } });
    await flush();

    expect(search.getState()).toEqual({ status: "results", cities: [ROSTOV] });
    expect(seen).not.toContainEqual({ status: "results", cities: [MOSCOW] });
  });

  test("a stale error from an aborted request is ignored", async () => {
    const { fetchImpl, calls } = deferredFetch();
    const search = createCitySearch({ fetchImpl });
    search.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    search.search("ростов");
    calls[0]?.reject(new DOMException("aborted", "AbortError"));
    await flush();
    expect(search.getState()).toEqual({ status: "loading" });
  });

  test("keeps at most one request in flight", async () => {
    const { fetchImpl, calls } = deferredFetch();
    const search = createCitySearch({ fetchImpl });
    for (const text of ["мо", "мос", "моск", "москв"]) {
      search.search(text);
      await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    }
    expect(calls).toHaveLength(4);
    expect(calls.slice(0, -1).every((call) => call.signal?.aborted)).toBe(true);
    expect(calls.at(-1)?.signal?.aborted).toBe(false);
  });

  test("caches answers by normalized query, empty ones too", async () => {
    const fetchImpl = vi.fn<FetchLike>(async (url) => respond({ body: { cities: url.includes(encodeURIComponent("нигде")) ? [] : [MOSCOW] } }));
    const search = createCitySearch({ fetchImpl });
    search.search("Москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    search.search("  москва ");
    expect(search.getState()).toEqual({ status: "results", cities: [MOSCOW] });
    search.search("нигде");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(search.getState()).toEqual({ status: "empty" });
    search.search("НИГДЕ");
    expect(search.getState()).toEqual({ status: "empty" });
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS * 4);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test.each([
    ["400", { ok: false, status: 400, body: { ok: false, error: "invalid" } }],
    ["429", { ok: false, status: 429, body: { ok: false, error: "rate_limited" } }],
    ["500", { ok: false, status: 500, body: {} }],
    ["an unexpected body", { body: { cities: "нет" } }],
    ["a city without coordinates", { body: { cities: [{ id: 1, name: "Москва" }] } }],
    ["a null body", { body: null }],
  ] as const)("turns %s into the error state and does not cache it", async (_label, reply) => {
    const fetchImpl = vi.fn<FetchLike>(async () => respond(reply));
    const search = createCitySearch({ fetchImpl });
    search.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(search.getState()).toEqual({ status: "error" });
    search.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test("a network failure or unreadable JSON never throws, it becomes the error state", async () => {
    const failing = createCitySearch({ fetchImpl: async () => Promise.reject(new TypeError("Failed to fetch")) });
    failing.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(failing.getState()).toEqual({ status: "error" });

    const broken = createCitySearch({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError("bad json")) }) });
    broken.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(broken.getState()).toEqual({ status: "error" });
  });

  test("recovers after an error on the next query", async () => {
    let fail = true;
    const search = createCitySearch({ fetchImpl: async () => (fail ? respond({ ok: false, status: 503 }) : respond({ body: { cities: [MOSCOW] } })) });
    search.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(search.getState().status).toBe("error");
    fail = false;
    search.search("москва ");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(search.getState()).toEqual({ status: "results", cities: [MOSCOW] });
  });

  test("reset returns to idle, cancels the pending timer and drops the response in flight", async () => {
    const { fetchImpl, calls } = deferredFetch();
    const search = createCitySearch({ fetchImpl });
    search.search("москва");
    search.reset();
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS * 2);
    expect(calls).toHaveLength(0);

    search.search("москва");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    search.reset();
    expect(calls[0]?.signal?.aborted).toBe(true);
    calls[0]?.resolve({ body: { cities: [MOSCOW] } });
    await flush();
    expect(search.getState()).toEqual({ status: "idle" });
  });

  test("notifies subscribers until they unsubscribe or the search is disposed", async () => {
    const search = createCitySearch({ fetchImpl: async () => respond({ body: { cities: [MOSCOW] } }) });
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = search.subscribe(first);
    search.subscribe(second);
    search.search("москва");
    expect(first).toHaveBeenCalledWith({ status: "loading" });
    stopFirst();
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenLastCalledWith({ status: "results", cities: [MOSCOW] });
    search.dispose();
    search.search("ростов");
    expect(second).toHaveBeenCalledTimes(2);
  });

  test("never writes the query to the console", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));
    const search = createCitySearch({ fetchImpl: async () => Promise.reject(new Error("секретный город")) });
    search.search("секретный город");
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  test("evicts the oldest cached query after 100 entries", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respond({ body: { cities: [MOSCOW] } }));
    const search = createCitySearch({ fetchImpl });
    for (let index = 0; index < 101; index += 1) {
      search.search(`город ${index}`);
      await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(101);
    search.search("город 100"); // свежий — из кэша
    expect(fetchImpl).toHaveBeenCalledTimes(101);
    search.search("город 0"); // самый старый вытеснен
    await vi.advanceTimersByTimeAsync(CITY_SEARCH_DELAY_MS);
    expect(fetchImpl).toHaveBeenCalledTimes(102);
  });
});

describe("formatPopulation", () => {
  test.each([
    [12_345, "12 345 жителей"],
    [1_100_000, "1 100 000 жителей"],
    [1, "1 житель"],
    [21, "21 житель"],
    [2, "2 жителя"],
    [34, "34 жителя"],
    [11, "11 жителей"],
    [112, "112 жителей"],
    [999, "999 жителей"],
    [1000, "1 000 жителей"],
    [101_000, "101 000 жителей"],
  ])("%i is written as %s", (population, expected) => {
    expect(formatPopulation(population)).toBe(expected);
  });
});

describe("formatCoordinates", () => {
  test("writes two decimals with the hemisphere", () => {
    expect(formatCoordinates(55.7512, 37.6184)).toBe("55.75° с. ш., 37.62° в. д.");
    expect(formatCoordinates(-33.8688, -70.6693)).toBe("33.87° ю. ш., 70.67° з. д.");
    expect(formatCoordinates(0, 0)).toBe("0.00° с. ш., 0.00° в. д.");
  });
});

describe("describeCities", () => {
  test("a unique city keeps the plain region line of the mockup", () => {
    const options = describeCities([ROSTOV, city({ id: 3, name: "Ростов", region: "Ярославская область" })]);
    expect(options.map((option) => option.regionLine)).toEqual(["Ростовская область, Россия", "Ярославская область, Россия"]);
    expect(options.map((option) => option.name)).toEqual(["Ростов-на-Дону", "Ростов"]);
    expect(options[0]?.city).toBe(ROSTOV);
  });

  test("a city-state without a region is shown with the country only", () => {
    expect(describeCities([city({ id: 9, name: "Сингапур", region: "", country: "Сингапур" })])[0]?.regionLine).toBe("Сингапур");
  });

  test("homonyms get the population after the region line", () => {
    const options = describeCities([city({ id: 10, name: "Новосёловка", population: 12_345 }), city({ id: 11, name: "Новосёловка", population: 1 }), ROSTOV]);
    expect(options.map((option) => option.regionLine)).toEqual([
      "Ростовская область, Россия · 12 345 жителей",
      "Ростовская область, Россия · 1 житель",
      "Ростовская область, Россия",
    ]);
  });

  test("homonyms without a known population get coordinates", () => {
    const options = describeCities([
      city({ id: 10, name: "Заречное", latitude: 55.75, longitude: 37.62 }),
      city({ id: 11, name: "Заречное", latitude: 54.1, longitude: 61.5 }),
    ]);
    expect(options.map((option) => option.regionLine)).toEqual([
      "Ростовская область, Россия · 55.75° с. ш., 37.62° в. д.",
      "Ростовская область, Россия · 54.10° с. ш., 61.50° в. д.",
    ]);
  });

  test("a homonym with population next to one without gets coordinates", () => {
    const options = describeCities([city({ id: 10, name: "Заречное", population: 500 }), city({ id: 11, name: "Заречное", population: 0, latitude: 54.1, longitude: 61.5 })]);
    expect(options.map((option) => option.regionLine)).toEqual(["Ростовская область, Россия · 500 жителей", "Ростовская область, Россия · 54.10° с. ш., 61.50° в. д."]);
  });

  test("homonyms with the same population are told apart by coordinates", () => {
    const options = describeCities([
      city({ id: 10, name: "Заречное", population: 500, latitude: 55.75, longitude: 37.62 }),
      city({ id: 11, name: "Заречное", population: 500, latitude: 54.1, longitude: 61.5 }),
    ]);
    expect(new Set(options.map((option) => option.regionLine)).size).toBe(2);
    expect(options[0]?.regionLine).toContain("55.75° с. ш.");
  });

  test("the same name in different regions is not a homonym", () => {
    const options = describeCities([city({ id: 10, name: "Заречное", population: 500 }), city({ id: 11, name: "Заречное", region: "Пензенская область", population: 700 })]);
    expect(options.map((option) => option.regionLine)).toEqual(["Ростовская область, Россия", "Пензенская область, Россия"]);
  });
});

describe("navigateCityList", () => {
  const open = { visible: true, count: 3, active: 0 };

  test("ArrowDown walks down the options and wraps from the last to the first", () => {
    expect(navigateCityList({ ...open, key: "ArrowDown" })).toEqual({ handled: true, open: true, active: 1, select: null });
    expect(navigateCityList({ ...open, key: "ArrowDown", active: 2 })).toEqual({ handled: true, open: true, active: 0, select: null });
  });

  test("ArrowUp walks up and wraps from the first to the last", () => {
    expect(navigateCityList({ ...open, key: "ArrowUp", active: 2 })).toMatchObject({ active: 1 });
    expect(navigateCityList({ ...open, key: "ArrowUp" })).toMatchObject({ handled: true, active: 2 });
  });

  test("an arrow reopens a closed list: ArrowDown on the first option, ArrowUp on the last", () => {
    expect(navigateCityList({ key: "ArrowDown", visible: false, count: 3, active: 1 })).toEqual({ handled: true, open: true, active: 0, select: null });
    expect(navigateCityList({ key: "ArrowUp", visible: false, count: 3, active: 1 })).toEqual({ handled: true, open: true, active: 2, select: null });
  });

  test("arrows do nothing when there is nothing to choose from", () => {
    expect(navigateCityList({ key: "ArrowDown", visible: true, count: 0, active: -1 }).handled).toBe(false);
    expect(navigateCityList({ key: "ArrowUp", visible: false, count: 0, active: -1 }).handled).toBe(false);
  });

  test("Enter picks the highlighted option and closes the list", () => {
    expect(navigateCityList({ ...open, key: "Enter", active: 2 })).toEqual({ handled: true, open: false, active: 2, select: 2 });
  });

  test("Enter is left to the form when no option is highlighted, the list is closed or empty", () => {
    expect(navigateCityList({ ...open, key: "Enter", active: -1 }).handled).toBe(false);
    expect(navigateCityList({ key: "Enter", visible: false, count: 3, active: 0 }).handled).toBe(false);
    expect(navigateCityList({ key: "Enter", visible: true, count: 0, active: -1 }).handled).toBe(false);
    expect(navigateCityList({ ...open, key: "Enter", active: 5 }).handled).toBe(false);
  });

  test("Escape closes an open list and is left alone when it is already closed", () => {
    expect(navigateCityList({ ...open, key: "Escape" })).toEqual({ handled: true, open: false, active: 0, select: null });
    expect(navigateCityList({ key: "Escape", visible: false, count: 3, active: 0 }).handled).toBe(false);
  });

  test("Tab and typing keys are never taken, so there is no keyboard trap", () => {
    for (const key of ["Tab", "a", "Backspace", "Home", "End", " "]) expect(navigateCityList({ ...open, key }).handled).toBe(false);
  });
});
