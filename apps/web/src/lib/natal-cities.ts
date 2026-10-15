import type { City } from "@oracle/geo";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, normalizeQuery } from "@oracle/geo/query";
import { CITY_POPULATION_FORMS, COORD_LATITUDE, COORD_LONGITUDE, formatCityRegion } from "./natal-copy";
import { pluralRu } from "./plural";

// Клиент поиска города для калькулятора натальной карты. Из @oracle/geo берём только тип City и «лёгкий» адрес @oracle/geo/query
// (нормализация запроса): сама база городов (~4 МБ) остаётся на сервере и в браузер не попадает.
// Текст запроса — место, которое человек ищет, — нигде не логируется и не сохраняется, кроме кэша в памяти этой вкладки.

export type CityState =
  | { status: "idle" } // запрос слишком короткий или слишком длинный, запросов нет
  | { status: "loading" }
  | { status: "results"; cities: readonly City[] }
  | { status: "empty" } // сервер ответил, ничего не нашлось
  | { status: "error" }; // сеть, 400, 429, 5xx или непонятный ответ

export type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<Pick<Response, "ok" | "status" | "json">>;

export type CitySearch = {
  search(query: string): void; // отложенный запрос; предыдущий отменяется, устаревший ответ не показывается
  reset(): void; // назад в idle: город выбран или поле очищено
  getState(): CityState;
  subscribe(listener: (state: CityState) => void): () => void;
  dispose(): void;
};

export const CITY_SEARCH_DELAY_MS = 250;
const CITIES_ENDPOINT = "/api/cities";
const MAX_CACHED_QUERIES = 100;

const IDLE: CityState = { status: "idle" };
const LOADING: CityState = { status: "loading" };
const EMPTY: CityState = { status: "empty" };
const FAILED: CityState = { status: "error" };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function isCity(value: unknown): value is City {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.region === "string" &&
    typeof value.country === "string" &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    typeof value.zone === "string" &&
    typeof value.population === "number"
  );
}

// Ответ сервера { cities: City[] }; всё остальное — ошибка поиска
function parseCities(body: unknown): readonly City[] | null {
  if (!isRecord(body) || !Array.isArray(body.cities)) return null;
  return body.cities.every(isCity) ? body.cities : null;
}

export function createCitySearch(options: { fetchImpl: FetchLike; delayMs?: number }): CitySearch {
  const { fetchImpl, delayMs = CITY_SEARCH_DELAY_MS } = options;
  const cache = new Map<string, readonly City[]>(); // ключ — normalizeQuery(запрос); пустые ответы тоже кэшируются
  const listeners = new Set<(state: CityState) => void>();
  let state: CityState = IDLE;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  let generation = 0; // номер последнего запроса: ответ с другим номером устарел

  function publish(next: CityState): void {
    state = next;
    for (const listener of [...listeners]) listener(next);
  }

  // Останавливает всё, что ещё не закончилось: таймер и запрос в полёте. Ответ отменённого запроса отбросит проверка номера
  function stop(): void {
    generation += 1;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    controller?.abort();
    controller = null;
  }

  const stateFor = (cities: readonly City[]): CityState => (cities.length > 0 ? { status: "results", cities } : EMPTY);

  function remember(key: string, cities: readonly City[]): void {
    if (cache.size >= MAX_CACHED_QUERIES) {
      const oldest = cache.keys().next();
      if (!oldest.done) cache.delete(oldest.value);
    }
    cache.set(key, cities);
  }

  async function load(key: string, own: number): Promise<void> {
    const request = new AbortController();
    controller = request;
    try {
      const response = await fetchImpl(`${CITIES_ENDPOINT}?q=${encodeURIComponent(key)}`, { signal: request.signal });
      if (own !== generation) return;
      if (!response.ok) return publish(FAILED);
      const cities = parseCities(await response.json());
      if (own !== generation) return;
      if (cities === null) return publish(FAILED);
      remember(key, cities);
      publish(stateFor(cities));
    } catch {
      // Отменённый запрос — не ошибка: его уже заменил новый
      if (own === generation) publish(FAILED);
    } finally {
      if (controller === request) controller = null;
    }
  }

  return {
    search(query) {
      stop();
      const key = normalizeQuery(query);
      if (key.length < MIN_QUERY_LENGTH || key.length > MAX_QUERY_LENGTH) return publish(IDLE);
      const cached = cache.get(key);
      if (cached) return publish(stateFor(cached));
      publish(LOADING);
      const own = generation;
      timer = setTimeout(() => {
        timer = null;
        void load(key, own);
      }, delayMs);
    },
    reset() {
      stop();
      publish(IDLE);
    },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    dispose() {
      stop();
      listeners.clear();
    },
  };
}

// ---------- Подписи вариантов в списке ----------

export type CityOption = { city: City; name: string; regionLine: string };

const THIN_NO_BREAK_SPACE = " ";

// 12345 → «12 345 жителей» (тонкие неразрывные пробелы между тысячами)
export function formatPopulation(population: number): string {
  const count = Math.round(population);
  return `${String(count).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_NO_BREAK_SPACE)} ${pluralRu(count, CITY_POPULATION_FORMS)}`;
}

// «55.75° с. ш., 37.62° в. д.»; южная широта и западная долгота — «ю. ш.» и «з. д.»
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${Math.abs(latitude).toFixed(2)}° ${latitude < 0 ? COORD_LATITUDE.south : COORD_LATITUDE.north}, ${Math.abs(longitude).toFixed(2)}° ${longitude < 0 ? COORD_LONGITUDE.west : COORD_LONGITUDE.east}`;
}

const sameBirthplaceLabel = (city: City): string => [city.name, city.region, city.country].join("\u0000");

// Строки списка для людей. Города с одинаковыми названием, областью и страной в одном списке различаем добавкой к строке региона:
// число жителей, если оно известно (> 0), иначе координаты; если и жители совпали — координаты у всей группы.
// У неповторяющихся городов добавки нет: «Ростовская область, Россия» остаётся как в макете.
export function describeCities(cities: readonly City[]): CityOption[] {
  const groups = new Map<string, City[]>();
  for (const city of cities) groups.set(sameBirthplaceLabel(city), [...(groups.get(sameBirthplaceLabel(city)) ?? []), city]);

  const coordinatesOf = (city: City) => formatCoordinates(city.latitude, city.longitude);
  const populationOrCoordinates = (city: City) => (city.population > 0 ? formatPopulation(city.population) : coordinatesOf(city));
  const suffixFor = (city: City, group: readonly City[]): string => {
    if (group.length < 2) return "";
    // Жители у нескольких одинаковых городов могут совпасть: тогда различаем всю группу по координатам
    const distinct = new Set(group.map(populationOrCoordinates)).size === group.length;
    return distinct ? populationOrCoordinates(city) : coordinatesOf(city);
  };

  return cities.map((city) => {
    const suffix = suffixFor(city, groups.get(sameBirthplaceLabel(city)) ?? []);
    return { city, name: city.name, regionLine: [formatCityRegion(city), suffix].filter((part) => part !== "").join(" · ") };
  });
}

// ---------- Клавиатура в списке городов ----------

export type ListKeyInput = { key: string; visible: boolean; count: number; active: number }; // visible — список показан; count — число вариантов
export type ListKeyResult = { handled: boolean; open: boolean; active: number; select: number | null };

// Что делает клавиша в поле с выпадающим списком (шаблон ARIA «combobox»). Фокус остаётся в поле, выбранный пункт — active (-1 — никакой):
// стрелки ходят по кругу и заново открывают закрытый список, Enter выбирает пункт, Escape закрывает. Остальные клавиши (в том числе Tab) не трогаем
export function navigateCityList({ key, visible, count, active }: ListKeyInput): ListKeyResult {
  const ignored: ListKeyResult = { handled: false, open: visible, active, select: null };
  switch (key) {
    case "ArrowDown":
    case "ArrowUp": {
      if (count === 0) return ignored;
      const down = key === "ArrowDown";
      if (!visible) return { handled: true, open: true, active: down ? 0 : count - 1, select: null };
      return { handled: true, open: true, active: down ? (active + 1) % count : (active - 1 + count) % count, select: null };
    }
    case "Enter":
      // Пока список открыт, Enter выбирает город, а не отправляет форму
      return visible && count > 0 && active >= 0 && active < count ? { handled: true, open: false, active, select: active } : ignored;
    case "Escape":
      return visible ? { handled: true, open: false, active, select: null } : ignored;
    default:
      return ignored;
  }
}
