import type { MonthPage } from "./lunar-calendar";
import { placeKey, type MoonPlace } from "./moon-place";
import { loadMonthPage } from "./moon-place-compute";

// Один расчёт месяца на город и месяц: сетка, панель дня и таблица страницы берут тот же результат, а не считают месяц по два раза.
// Упавший расчёт (например, не загрузился кусок с движком) из кеша убирается, чтобы следующий вызов попробовал снова
const cache = new Map<string, Promise<MonthPage>>();

export function getMonthPage(place: MoonPlace, year: number, month: number, now: Date, load: typeof loadMonthPage = loadMonthPage): Promise<MonthPage> {
  const key = `${placeKey(place)}|${year}-${month}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = load(place, year, month, now).catch((error: unknown) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, promise);
  }
  return promise;
}

export const clearMonthCache = (): void => cache.clear();
