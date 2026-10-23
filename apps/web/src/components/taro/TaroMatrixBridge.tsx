"use client";

import Link from "next/link";
import { reachGoal } from "@/lib/analytics";
import { TARO_BRIDGE, TARO_BRIDGE_CTA_GOAL } from "@/lib/taro-bridge";

// Мягкий мост с таро к матрице: стоит в конце страницы карты и страницы карты дня, не мешает самому толкованию.
// Рабочая вёрстка на готовых классах, вид при желании доводит Codex
export function TaroMatrixBridge({ context, id }: { context: "card" | "day"; id: string }) {
  return (
    <aside className="taro-bridge" aria-labelledby={id}>
      <h2 id={id}>{TARO_BRIDGE.title}</h2>
      <p>{TARO_BRIDGE.text[context]}</p>
      <p>
        <Link className="button button--lavender" href={TARO_BRIDGE.href} onClick={() => reachGoal(TARO_BRIDGE_CTA_GOAL)}>
          {TARO_BRIDGE.cta}
        </Link>
      </p>
      <p className="taro-bridge__note muted">
        {TARO_BRIDGE.promise} {TARO_BRIDGE.terms}
      </p>
    </aside>
  );
}
