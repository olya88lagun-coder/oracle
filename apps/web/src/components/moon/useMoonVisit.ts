"use client";

import { useEffect, useState } from "react";
import type { CollectionId } from "@/lib/moon-collection";
import { recordVisit, type StorageLike, type VisitState } from "@/lib/moon-visit";

const browserStorage = (): StorageLike => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// Записывает заход на лунную страницу и открывает гравюры `unlockIds`. До монтирования (и на сервере) — null.
// Повторный вызов за сутки ничего не меняет (recordVisit идемпотентна), поэтому строгий режим React и две вкладки безопасны
export function useMoonVisit(unlockIds: readonly CollectionId[]): VisitState | null {
  const [state, setState] = useState<VisitState | null>(null);
  const key = unlockIds.join(",");
  useEffect(() => {
    setState(recordVisit(browserStorage(), new Date(), key ? (key.split(",") as CollectionId[]) : []));
  }, [key]);
  return state;
}
