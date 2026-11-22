import type { MoonPlace } from "./moon-place";
import { toPlace } from "./moon-place";
import type { MonthPage } from "./lunar-calendar";
import type { MoonRibbonData } from "./moon-ribbon";
import type { MoonToday } from "./moon-today";

// Ленивые загрузчики расчёта для выбранного города: движок Луны и тексты суток, фаз и знаков подгружаются динамическим import()
// только после выбора города (или при сохранённом городе), а не вместе с первой загрузкой страницы
export async function loadMoonToday(place: MoonPlace, now: Date): Promise<MoonToday> {
  const { buildMoonToday } = await import("./moon-today");
  return buildMoonToday(now, toPlace(place));
}

export async function loadRibbonData(place: MoonPlace, now: Date): Promise<MoonRibbonData> {
  const { moonRibbonData } = await import("./moon-ribbon");
  return moonRibbonData(now, toPlace(place));
}

export async function loadMonthPage(place: MoonPlace, year: number, month: number, now: Date): Promise<MonthPage> {
  const { buildMonthPage } = await import("./lunar-calendar");
  return buildMonthPage(year, month, now, toPlace(place));
}
