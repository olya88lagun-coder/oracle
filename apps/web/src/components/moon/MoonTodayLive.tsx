"use client";

import { useEffect, useState } from "react";
import { placeKey, placeLabel } from "@/lib/moon-place";
import { loadMoonToday } from "@/lib/moon-place-compute";
import { placeNoteFor } from "@/lib/moon-place-copy";
import { usePlace } from "@/lib/moon-place-store";
import type { MoonToday } from "@/lib/moon-today";
import { MoonTodayView } from "./MoonTodayView";

// «Луна сегодня» для выбранного города. Без города — московские данные сервера. С городом после монтирования расчёт подгружается
// динамическим import() и пересчитывает видимое; пока он грузится или упал, остаётся серверный результат. Устаревший ответ
// (город сменили, пока считалось) отбрасывается. `<h1>` с датой, мета-теги и разметка остаются серверными (московскими)
export function MoonTodayLive({ initial, headingDate }: { initial: MoonToday; headingDate: string }) {
  const place = usePlace();
  const [live, setLive] = useState<{ key: string; today: MoonToday } | null>(null);

  useEffect(() => {
    if (!place) {
      setLive(null);
      return;
    }
    let current = true;
    loadMoonToday(place, new Date())
      .then((today) => {
        if (current) setLive({ key: placeKey(place), today });
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [place]);

  const local = place && live?.key === placeKey(place) ? live.today : null;
  return <MoonTodayView today={local ?? initial} headingDate={headingDate} placeLabel={local ? placeLabel(place) : null} placeNote={local && place ? placeNoteFor(place.name, headingDate, local.dateLabel) : null} />;
}
