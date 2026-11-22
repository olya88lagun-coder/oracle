"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { openedBy } from "@/lib/moon-collection";
import { localFor, placeKey, placeLabel } from "@/lib/moon-place";
import { placeChipAria } from "@/lib/moon-place-copy";
import { loadRibbonData } from "@/lib/moon-place-compute";
import { usePlace } from "@/lib/moon-place-store";
import { daysInRow } from "@/lib/moon-album-copy";
import { moonTabs, type MoonTabKey } from "@/lib/moon-nav";
import { MOON_PATH } from "@/lib/moon-paths";
import type { MoonRibbonData } from "@/lib/moon-ribbon";
import { RIBBON_LABEL, ribbonPhaseLine, ribbonSignLine } from "@/lib/moon-ribbon-copy";
import { MoonPlaceDialog } from "./MoonPlaceDialog";
import { useMoonVisit } from "./useMoonVisit";

const RING = 2 * Math.PI * 22;

const isRibbonData = (value: unknown): value is MoonRibbonData =>
  typeof value === "object" && value !== null && typeof (value as MoonRibbonData).phase === "string" && typeof (value as MoonRibbonData).sign === "string" && typeof (value as MoonRibbonData).lunarDay?.number === "number";

// Лента «Лунный раздел» под шапкой каждой лунной страницы: живой диск с кольцом суток, вкладки между страницами, нить заходов.
// Вкладки-ссылки отрисованы на сервере сразу; данные на сегодня приходят пропсом (динамические страницы) или у GET /api/moon/today (страницы с кешем).
// Ошибка запроса не ломает ленту: остаются вкладки. Заход и гравюры записывает общий модуль привычки (moon-visit.ts)
export function MoonRibbon({ current, now, initial, albumHref = `${MOON_PATH}#moon-album` }: { current: MoonTabKey | null; now: Date; initial?: MoonRibbonData; albumHref?: string }) {
  const [data, setData] = useState<MoonRibbonData | null>(initial ?? null);
  const visit = useMoonVisit(data ? openedBy(data.sign, data.phase) : []);
  const tabsRef = useRef<HTMLUListElement>(null);
  const place = usePlace();
  const [placeData, setPlaceData] = useState<{ key: string; value: MoonRibbonData } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (initial) return;
    const controller = new AbortController();
    fetch("/api/moon/today", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: unknown) => {
        if (isRibbonData(value)) setData(value);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [initial]);

  // Выбран город: данные ленты пересчитываются в браузере; пока расчёт грузится или упал, остаётся серверный (московский) результат.
  // Устаревший ответ (город сменили, пока считалось) отбрасывается
  useEffect(() => {
    if (!place) {
      setPlaceData(null);
      return;
    }
    let current = true;
    loadRibbonData(place, new Date())
      .then((value) => {
        if (current) setPlaceData({ key: placeKey(place), value });
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [place]);

  // На телефоне вкладки в одну строку с прокруткой: текущая встаёт в видимую область (сама страница не прокручивается)
  useEffect(() => {
    const list = tabsRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && tab) list.scrollLeft = tab.offsetLeft - (list.clientWidth - tab.clientWidth) / 2;
  }, [current]);

  const shown = localFor(place, placeData) ?? data;
  const frame = visit && visit.rewards.length > 0 ? Math.max(...visit.rewards) : 0;
  const streak = visit?.streak.current ?? 0;
  return (
    <nav className="moon-rail" aria-label={RIBBON_LABEL} data-frame={frame || undefined}>
      {shown && (
        <div className="moon-rail__now">
          <div className="moon-rail__orbit" aria-hidden="true">
            <svg viewBox="0 0 52 52">
              <circle className="moon-rail__ring" cx="26" cy="26" r="22" />
              <circle className="moon-rail__prog" cx="26" cy="26" r="22" strokeDasharray={RING} strokeDashoffset={RING * (1 - shown.lunarDay.progress)} />
            </svg>
            {shown.discImage && <Image src={shown.discImage} alt="" width={40} height={40} unoptimized />}
          </div>
          <p className="moon-rail__text">
            <b>{ribbonPhaseLine(shown)}</b>
            <span>{ribbonSignLine(shown)}</span>
          </p>
        </div>
      )}
      <ul className="moon-rail__tabs" ref={tabsRef}>
        {moonTabs(now).map((tab) => (
          <li key={tab.key}>
            <Link className="moon-rail__tab" href={tab.href} aria-current={tab.key === current ? "page" : undefined}>{tab.label}</Link>
          </li>
        ))}
      </ul>
      <button type="button" className="moon-rail__place" aria-haspopup="dialog" aria-label={placeChipAria(placeLabel(place))} onClick={() => setPickerOpen(true)}>{placeLabel(place)} <span aria-hidden="true">▾</span></button>
      <MoonPlaceDialog open={pickerOpen} onClose={() => setPickerOpen(false)} current={place} />
      {streak >= 1 && <Link className="moon-rail__streak" href={albumHref}>{daysInRow(streak)}</Link>}
    </nav>
  );
}
