"use client";

import Image from "next/image";
import { useState } from "react";
import type { PhaseId } from "@oracle/core/moon/visual";
import type { SignId } from "@oracle/core/natal";
import { nextGravure, type CollectionId } from "@/lib/moon-collection";
import type { CollectionItem } from "@/lib/moon-collection-items";
import { ALBUM_FIRST_DAY, ALBUM_FRESH, ALBUM_GALLERY_TITLE, ALBUM_HIDE, ALBUM_LEAD, ALBUM_REWARDS, ALBUM_THREAD_TITLE, ALBUM_TITLE, albumNext, albumOpened, albumVisitsNote, daysInRow } from "@/lib/moon-album-copy";
import { threadBeads, type ThreadDay } from "@/lib/moon-thread";
import { REWARD_STEPS } from "@/lib/moon-visit";
import { phaseImage } from "@/lib/moon-images";
import { useMoonVisit } from "./useMoonVisit";

type Props = {
  thread: readonly ThreadDay[];
  days: readonly { date: string; sign: SignId; phase: PhaseId }[];
  items: readonly CollectionItem[];
  todayUnlock: readonly CollectionId[];
};

// «Лунный альбом»: награда за заход, нить Луны за 14 дней, альбом из 20 гравюр и награды-рамки.
// Заход и открытие гравюр записывает общий модуль привычки (moon-visit.ts); до монтирования показаны приглушённые заготовки
export function MoonAlbum({ thread, days, items, todayUnlock }: Props) {
  const state = useMoonVisit(todayUnlock);
  const [hidden, setHidden] = useState(false);
  const today = state?.today ?? thread[thread.length - 1]?.date ?? "";
  const beads = threadBeads(thread, state?.visits ?? [], today);
  const seen = state?.seen ?? [];
  const freshItems = items.filter((item) => state?.fresh.includes(item.id));
  const next = state ? nextGravure(seen, days, today) : null;
  const nextName = next ? items.find((item) => item.id === next.id)?.name : undefined;
  const frame = state && state.rewards.length > 0 ? Math.max(...state.rewards) : 0;
  const lit = beads.filter((bead) => bead.lit).length;

  return (
    <section id="moon-album" className="moon-album" aria-labelledby="moon-album-title" data-frame={frame || undefined}>
      <h2 id="moon-album-title">{ALBUM_TITLE}</h2>
      <p className="moon-album__lead">{ALBUM_LEAD}</p>

      {freshItems.length > 0 && !hidden && (
        <div className="moon-album__reveal" role="status">
          {freshItems[0]?.image && <Image src={freshItems[0].image} alt="" width={104} height={104} unoptimized />}
          <div>
            <p className="moon-album__eyebrow">{ALBUM_FRESH}</p>
            <p className="moon-album__reveal-name">{freshItems.map((item) => item.name).join(", ")}</p>
            {next && nextName && <p className="moon-album__muted">{albumNext(next.date, nextName)}</p>}
            <button type="button" className="moon-album__hide" onClick={() => setHidden(true)}>{ALBUM_HIDE}</button>
          </div>
        </div>
      )}
      {state && freshItems.length === 0 && next && nextName && <p className="moon-album__muted moon-album__next">{albumNext(next.date, nextName)}</p>}

      <div className="moon-album__head">
        <h3>{ALBUM_THREAD_TITLE}</h3>
        {state && state.streak.current >= 1 && (
          <p className="moon-album__streak">{daysInRow(state.streak.current)}{state.streak.best > state.streak.current ? ` · лучший ряд ${state.streak.best}` : ""}</p>
        )}
      </div>
      <ol className="moon-album__thread">
        {beads.map((bead) => (
          <li key={bead.date} className={`moon-album__bead${bead.lit ? " is-lit" : ""}${bead.isToday ? " is-today" : ""}`}>
            {phaseImage(bead.phase, 160) && <Image src={phaseImage(bead.phase, 160)!} alt="" width={40} height={40} unoptimized />}
            <span>{bead.label}</span>
          </li>
        ))}
      </ol>
      {state && <p className="visually-hidden">{albumVisitsNote(lit, state.streak.current)}</p>}
      {state && state.visits.length === 1 && <p className="moon-album__muted">{ALBUM_FIRST_DAY}</p>}

      <div className="moon-album__head">
        <h3>{ALBUM_GALLERY_TITLE}</h3>
        {state && <p className="moon-album__count">{albumOpened(seen.length, items.length)}</p>}
      </div>
      <ul className="moon-album__gallery">
        {items.map((item) => {
          const open = seen.includes(item.id);
          const isFresh = Boolean(state?.fresh.includes(item.id));
          return (
            <li key={item.id} className={`moon-album__slot${open ? " is-open" : ""}${isFresh ? " is-fresh" : ""}`}>
              {item.image && <Image src={item.image} alt="" width={96} height={96} unoptimized sizes="96px" />}
              <span>{item.name}</span>
            </li>
          );
        })}
      </ul>

      <ul className="moon-album__rewards">
        {REWARD_STEPS.map((step) => (
          <li key={step} className={`moon-album__reward${state?.rewards.includes(step) ? " is-done" : ""}`}>{ALBUM_REWARDS[step]}</li>
        ))}
      </ul>
    </section>
  );
}
