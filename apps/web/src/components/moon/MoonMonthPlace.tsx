"use client";

import { useEffect, useState } from "react";
import type { MonthPage } from "@/lib/lunar-calendar";
import { placeKey } from "@/lib/moon-place";
import { getMonthPage } from "@/lib/moon-month-cache";
import { usePlace } from "@/lib/moon-place-store";
import { MoonMonthDays } from "./MoonMonthDays";
import { MoonMonthStage } from "./MoonMonthStage";

// Данные страницы месяца, которые зависят от города: сетка, события, кривая, лента знаков и таблица по дням
export type MonthPlaceData = Pick<MonthPage, "cells" | "weeks" | "events" | "curve" | "ribbon" | "afterMonth" | "rows" | "guide">;

// Московские данные сервера, а для выбранного города — пересчёт того же месяца в браузере (по зоне города). Расчёт подгружается лениво
// и считается один раз на город и месяц (moon-month-cache.ts); пока он грузится или упал, остаются данные сервера.
// Устаревший ответ (город сменили, пока считалось) отбрасывается
function useMonthPlaceData(year: number, month: number, initial: MonthPlaceData): { data: MonthPlaceData; zone: string | undefined } {
  const place = usePlace();
  const [live, setLive] = useState<{ key: string; page: MonthPage } | null>(null);

  useEffect(() => {
    if (!place) {
      setLive(null);
      return;
    }
    let current = true;
    getMonthPage(place, year, month, new Date())
      .then((page) => {
        if (current) setLive({ key: placeKey(place), page });
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [place, year, month]);

  const local = place && live?.key === placeKey(place) ? live.page : null;
  return { data: local ?? initial, zone: local && place ? place.zone : undefined };
}

export function MoonMonthPlace({ year, month, initial, initialIndex }: { year: number; month: number; initial: MonthPlaceData; initialIndex: number }) {
  const { data, zone } = useMonthPlaceData(year, month, initial);
  return <MoonMonthStage year={year} month={month} days={data.cells} weeks={data.weeks} events={data.events} curve={data.curve} ribbon={data.ribbon} afterMonth={data.afterMonth} initialIndex={initialIndex} zone={zone} />;
}

// Таблица «Данные по дням таблицей» пересчитывается тем же результатом
export function MoonMonthRowsPlace({ year, month, initial }: { year: number; month: number; initial: MonthPlaceData }) {
  const { data } = useMonthPlaceData(year, month, initial);
  return <MoonMonthDays rows={data.rows} guide={data.guide} />;
}

// Ярлык под заголовком: «По Москве» или «Для города <название>»
export function MoonPlaceLine() {
  const place = usePlace();
  return <p className="moon-hero__place">{place ? `Для города ${place.name}` : "По Москве"}</p>;
}
