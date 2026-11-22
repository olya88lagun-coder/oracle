import { useSyncExternalStore } from "react";
import { parsePlace, PLACE_KEY, type MoonPlace, type StorageLike } from "./moon-place";

// Внешнее хранилище выбранного города для useSyncExternalStore: без провайдера, одно значение на вкладку.
// На сервере и до чтения браузера — null (Москва). Другие вкладки подхватываются по событию `storage`
let current: MoonPlace | null = null;
let loaded = false;
const listeners = new Set<() => void>();

const browserStorage = (): StorageLike => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const notify = () => listeners.forEach((listener) => listener());

export function getPlace(): MoonPlace | null {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      current = parsePlace(browserStorage()?.getItem(PLACE_KEY) ?? null);
    } catch {
      current = null;
    }
  }
  return current;
}

// null стирает запись (выбор «Москва»). Если хранилище закрыто, выбор живёт до перезагрузки страницы
export function setPlace(place: MoonPlace | null, storage: StorageLike = browserStorage()): void {
  current = place;
  loaded = true;
  try {
    if (place) storage?.setItem(PLACE_KEY, JSON.stringify(place));
    else storage?.removeItem(PLACE_KEY);
  } catch {
    // Хранилище закрыто или переполнено: выбор остаётся в памяти
  }
  notify();
}

export function subscribePlace(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PLACE_KEY) return;
    current = parsePlace(event.newValue);
    loaded = true;
    notify();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export const usePlace = (): MoonPlace | null => useSyncExternalStore(subscribePlace, getPlace, () => null);
