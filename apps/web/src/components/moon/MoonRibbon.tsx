"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { openedBy } from "@/lib/moon-collection";
import { daysInRow } from "@/lib/moon-album-copy";
import { moonTabs, type MoonTabKey } from "@/lib/moon-nav";
import { MOON_PATH } from "@/lib/moon-paths";
import type { MoonRibbonData } from "@/lib/moon-ribbon";
import { RIBBON_LABEL, ribbonPhaseLine, ribbonSignLine } from "@/lib/moon-ribbon-copy";
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

  // На телефоне вкладки в одну строку с прокруткой: текущая встаёт в видимую область (сама страница не прокручивается)
  useEffect(() => {
    const list = tabsRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && tab) list.scrollLeft = tab.offsetLeft - (list.clientWidth - tab.clientWidth) / 2;
  }, [current]);

  const frame = visit && visit.rewards.length > 0 ? Math.max(...visit.rewards) : 0;
  const streak = visit?.streak.current ?? 0;
  return (
    <nav className="moon-ribbon" aria-label={RIBBON_LABEL} data-frame={frame || undefined}>
      {data && (
        <div className="moon-ribbon__now">
          <div className="moon-ribbon__orbit" aria-hidden="true">
            <svg viewBox="0 0 52 52">
              <circle className="moon-ribbon__ring" cx="26" cy="26" r="22" />
              <circle className="moon-ribbon__prog" cx="26" cy="26" r="22" strokeDasharray={RING} strokeDashoffset={RING * (1 - data.lunarDay.progress)} />
            </svg>
            {data.discImage && <Image src={data.discImage} alt="" width={40} height={40} unoptimized />}
          </div>
          <p className="moon-ribbon__text">
            <b>{ribbonPhaseLine(data)}</b>
            <span>{ribbonSignLine(data)}</span>
          </p>
        </div>
      )}
      <ul className="moon-ribbon__tabs" ref={tabsRef}>
        {moonTabs(now).map((tab) => (
          <li key={tab.key}>
            <Link className="moon-ribbon__tab" href={tab.href} aria-current={tab.key === current ? "page" : undefined}>{tab.label}</Link>
          </li>
        ))}
      </ul>
      {streak >= 1 && <Link className="moon-ribbon__streak" href={albumHref}>{daysInRow(streak)}</Link>}
    </nav>
  );
}
