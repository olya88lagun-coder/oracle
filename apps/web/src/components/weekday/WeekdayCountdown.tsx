"use client";

import { useEffect, useState } from "react";
import { formatUntilNextCard, msUntilNextMoscowDay } from "@/lib/taro-day";

// «Планета сменится через …» до полуночи по Москве. До гидратации пусто: время знает только браузер
export function WeekdayCountdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilNextMoscowDay(new Date()));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);
  return <p className="weekday-now__countdown">{ms === null ? "" : `Планета сменится через ${formatUntilNextCard(ms)}`}</p>;
}
