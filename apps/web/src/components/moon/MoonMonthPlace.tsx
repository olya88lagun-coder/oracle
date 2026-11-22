"use client";

import { useEffect, useState } from "react";
import type { MonthPage } from "@/lib/lunar-calendar";
import { localFor, placeKey, type MoonPlace } from "@/lib/moon-place";
import { placeLineFor } from "@/lib/moon-place-copy";
import { getMonthPage } from "@/lib/moon-month-cache";
import { usePlace } from "@/lib/moon-place-store";
import { MoonMonthDays } from "./MoonMonthDays";
import { MoonMonthStage } from "./MoonMonthStage";

// Данные страницы месяца, которые зависят от города: сетка, события, кривая, лента знаков и таблица по дням
export type MonthPlaceData = Pick<MonthPage, "cells" | "weeks" | "events" | "curve" | "ribbon" | "afterMonth" | "rows" | "guide">;

// Пересчёт того же месяца для выбранного города: подгружается лениво и считается один раз на город и месяц (moon-month-cache.ts).
// Пока расчёт грузится или упал, page = null и остаются данные сервера. Устаревший ответ (город сменили, пока считалось) отбрасывается
function useMonthLive(year: number, month: number): { page: MonthPage | null; place: MoonPlace | null } {
  const place = usePlace();
  const [live, setLive] = useState<{ key: string; value: MonthPage } | null>(null);

  useEffect(() => {
    if (!place) {
      setLive(null);
      return;
    }
    let current = true;
    getMonthPage(place, year, month, new Date())
      .then((page) => {
        if (current) setLive({ key: placeKey(place), value: page });
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [place, year, month]);

  const page = localFor(place, live);
  return { page, place: page ? place : null };
}

function useMonthPlaceData(year: number, month: number, initial: MonthPlaceData): { data: MonthPlaceData; zone: string | undefined } {
  const { page, place } = useMonthLive(year, month);
  return { data: page ?? initial, zone: page && place ? place.zone : undefined };
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

// Ярлык под заголовком: «По Москве» или «Для города <название>» (когда данные города готовы)
export function MoonPlaceLine({ year, month }: { year: number; month: number }) {
  const { place } = useMonthLive(year, month);
  return <p className="moon-hero__place">{placeLineFor(place, place !== null)}</p>;
}
