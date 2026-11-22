"use client";

import { useEffect, useState } from "react";
import { COLLECTION_IDS } from "@/lib/moon-collection";
import { daysCount } from "@/lib/moon-album-copy";
import { readVisitState, type StorageLike, type VisitState } from "@/lib/moon-visit";

const browserStorage = (): StorageLike => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// «Ваша серия: N дней, открыто гравюр: M из 20» для вернувшегося человека. Читает привычку из браузера и ничего не записывает
// (главная не лунная страница); до чтения и для нового посетителя не занимает места
export function MoonTileStreak() {
  const [state, setState] = useState<VisitState | null>(null);
  useEffect(() => {
    setState(readVisitState(browserStorage(), new Date()));
  }, []);
  if (!state || state.visits.length === 0) return null;
  const open = `открыто гравюр: ${state.seen.length} из ${COLLECTION_IDS.length}`;
  return <p className="moon-portal__streak">{state.streak.current >= 1 ? `Ваша серия: ${daysCount(state.streak.current)}, ${open}` : `Вы уже заходили к Луне, ${open}`}</p>;
}
