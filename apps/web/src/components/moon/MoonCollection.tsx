"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { moscowDate } from "@/lib/lunar-calendar-paths";
import { nextOpening, openedBy, readSeen, unlock, writeSeen, type CollectionId } from "@/lib/moon-collection";
import type { CollectionItem } from "@/lib/moon-collection-items";
import type { SignId } from "@oracle/core/natal";
import type { PhaseId } from "@oracle/core/moon/visual";

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const dateLabel = (iso: string): string => dayMonth.format(new Date(`${iso}T12:00:00Z`));

// «Коллекция Луны»: 12 знаков и 8 фаз. Гравюра открывается, когда вы заходите на страницу в день, где Луна в этом знаке или фазе;
// закрытые видны силуэтом с подсказкой, когда откроются в этом месяце. Список хранится только в браузере (moon-collection.ts)
export function MoonCollection({ items, days }: { items: readonly CollectionItem[]; days: readonly { date: string; sign: SignId; phase: PhaseId }[] }) {
  const [seen, setSeen] = useState<readonly CollectionId[]>([]);
  const [fresh, setFresh] = useState<readonly CollectionId[]>([]);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    const iso = moscowDate(new Date());
    const current = readSeen();
    const day = days.find((item) => item.date === iso);
    setToday(iso);
    if (!day) {
      setSeen(current);
      return;
    }
    const result = unlock(current, openedBy(day.sign, day.phase));
    if (result.fresh.length > 0) writeSeen(result.seen);
    setSeen(result.seen);
    setFresh(result.fresh);
  }, [days]);

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
