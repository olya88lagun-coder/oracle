"use client";

import Image from "next/image";
import { moscowDate } from "@/lib/lunar-calendar-paths";
import { nextOpening, openedBy } from "@/lib/moon-collection";
import type { CollectionItem } from "@/lib/moon-collection-items";
import type { SignId } from "@oracle/core/natal";
import type { PhaseId } from "@oracle/core/moon/visual";
import { useMoonVisit } from "./useMoonVisit";

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const dateLabel = (iso: string): string => dayMonth.format(new Date(`${iso}T12:00:00Z`));

// «Коллекция Луны»: 12 знаков и 8 фаз. Гравюра открывается, когда вы заходите на страницу в день, где Луна в этом знаке или фазе;
// закрытые видны силуэтом с подсказкой, когда откроются в этом месяце. Список хранится только в браузере (moon-collection.ts)
export function MoonCollection({ items, days }: { items: readonly CollectionItem[]; days: readonly { date: string; sign: SignId; phase: PhaseId }[] }) {
  // Заход и открытие гравюр ведёт общий модуль привычки (moon-visit.ts); до монтирования в браузере список пуст
  const todayDay = days.find((item) => item.date === moscowDate(new Date()));
  const state = useMoonVisit(todayDay ? openedBy(todayDay.sign, todayDay.phase) : []);
  const seen = state?.seen ?? [];
  const fresh = state?.fresh ?? [];
  const today = state?.today ?? null;

  const names = items.filter((item) => fresh.includes(item.id)).map((item) => item.name);
  return (
    <section className="moon-collection" aria-labelledby="moon-collection-title">
      <h2 id="moon-collection-title">Коллекция Луны</h2>
      <p className="moon-collection__count">Открыто {seen.length} из {items.length}{seen.length === items.length ? ": коллекция собрана" : ""}. Гравюра открывается, когда вы заходите в день, где Луна в этом знаке или фазе. Список хранится только в этом браузере.</p>
      <p className="moon-collection__fresh" role="status">{names.length > 0 ? `Новая гравюра: ${names.join(", ")}` : ""}</p>
      <ul className="moon-collection__grid">
        {items.map((item) => {
          const open = seen.includes(item.id);
          const hint = open || today === null ? null : nextOpening(item.id, days, today);
          return (
            <li key={item.id} className="moon-collection__tile" data-open={open ? "true" : "false"} data-kind={item.kind} data-fresh={fresh.includes(item.id) ? "true" : undefined}>
              {item.image && <Image src={item.image} alt="" width={160} height={160} unoptimized sizes="96px" />}
              <span className="moon-collection__name">{item.name}</span>
              <span className="moon-collection__hint">{open ? "открыта" : hint ? `откроется ${dateLabel(hint)}` : "ждёт своего дня"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
