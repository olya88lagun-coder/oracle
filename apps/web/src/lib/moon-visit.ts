import { moscowDate } from "./lunar-calendar-paths";
import { parseSeen, SEEN_KEY, unlock, type CollectionId } from "./moon-collection";

// «Привычка» лунного раздела: заходы по дням, открытые гравюры, награды за ряд. Всё хранится только в браузере (localStorage),
// на сервер и в Метрику не уходит. Хранилище передаётся параметром, чтобы логику можно было проверить без браузера
export const VISITS_KEY = "moon:visits:v1";
export const REWARDS_KEY = "moon:rewards:v1";
export const FRESH_KEY = "moon:fresh:v1";
export const MAX_VISITS = 120;
export const REWARD_STEPS = [3, 7, 14, 30] as const;

export type StorageLike = Pick<Storage, "getItem" | "setItem"> | null;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const isIsoDate = (value: unknown): value is string => typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const dayBefore = (iso: string): string => new Date(Date.parse(`${iso}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parseVisits(raw: string | null): string[] {
  const value = parseJson(raw);
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isIsoDate))].sort().slice(-MAX_VISITS);
}

// Ряд: подряд идущие дни до сегодняшнего (если сегодня ещё нет — со вчерашнего); даты позже сегодняшней не считаются
export function visitStreak(visits: readonly string[], today: string): { current: number; best: number } {
  const days = [...new Set(visits.filter((date) => date <= today))].sort();
  const set = new Set(days);
  let current = 0;
  for (let day = set.has(today) ? today : dayBefore(today); set.has(day); day = dayBefore(day)) current++;
  let best = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && days[index - 1] === dayBefore(day) ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return { current, best };
}

// От старой даты к сегодняшней, включая today
export function lastDays(today: string, count: number): string[] {
  const days: string[] = [];
  for (let day = today, index = 0; index < count; day = dayBefore(day), index++) days.unshift(day);
  return days;
}

const isStep = (value: unknown): value is (typeof REWARD_STEPS)[number] => REWARD_STEPS.some((step) => step === value);

export function parseRewards(raw: string | null): { steps: number[]; best: number } {
  const value = parseJson(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { steps: [], best: 0 };
  const { steps, best } = value as { steps?: unknown; best?: unknown };
  return {
    steps: Array.isArray(steps) ? [...new Set(steps.filter(isStep))].sort((a, b) => a - b) : [],
    best: typeof best === "number" && Number.isInteger(best) && best >= 0 ? best : 0,
  };
}

// Гравюры, которые открылись сегодня: запись другого дня не считается
export function parseFresh(raw: string | null, today: string): CollectionId[] {
  const value = parseJson(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  const { date, ids } = value as { date?: unknown; ids?: unknown };
  return date === today && Array.isArray(ids) ? parseSeen(JSON.stringify(ids)) : [];
}

export type VisitState = {
  today: string;
  visits: string[];
  streak: { current: number; best: number };
  seen: CollectionId[];
  fresh: CollectionId[];
  rewards: number[];
  newRewards: number[];
};

const read = (storage: StorageLike, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const write = (storage: StorageLike, key: string, value: unknown): boolean => {
  try {
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const earnedSteps = (best: number): number[] => REWARD_STEPS.filter((step) => best >= step);

// Только чтение: плитка на главной не записывает заход
export function readVisitState(storage: StorageLike, now: Date): VisitState {
  const today = moscowDate(now);
  const visits = parseVisits(read(storage, VISITS_KEY)).filter((date) => date <= today);
  const rewards = parseRewards(read(storage, REWARDS_KEY));
  const streak = visitStreak(visits, today);
  return {
    today,
    visits,
    streak: { current: streak.current, best: Math.max(streak.best, rewards.best) },
    seen: parseSeen(read(storage, SEEN_KEY)),
    fresh: parseFresh(read(storage, FRESH_KEY), today),
    rewards: rewards.steps,
    newRewards: [],
  };
}

// Записывает заход на сегодня, открывает гравюры `unlockIds`, выдаёт награды. За сутки повторный вызов ничего не меняет.
// Если хранилище закрыто, заходы и награды не считаются (честнее, чем показывать «первый день» при каждой загрузке),
// а гравюры сегодняшнего дня остаются открытыми на время этой страницы
export function recordVisit(storage: StorageLike, now: Date, unlockIds: readonly CollectionId[]): VisitState {
  const today = moscowDate(now);
  const stored = parseVisits(read(storage, VISITS_KEY));
  const visits = [...new Set([...stored.filter((date) => date <= today), today])].slice(-MAX_VISITS);
  const unchanged = visits.length === stored.length && visits.every((date, index) => date === stored[index]);
  const persisted = unchanged || write(storage, VISITS_KEY, visits);

  const unlocked = unlock(parseSeen(read(storage, SEEN_KEY)), unlockIds);
  if (unlocked.fresh.length > 0) write(storage, SEEN_KEY, unlocked.seen);
  const prevFresh = parseFresh(read(storage, FRESH_KEY), today);
  const fresh = [...prevFresh, ...unlocked.fresh.filter((id) => !prevFresh.includes(id))];
  if (fresh.length > prevFresh.length) write(storage, FRESH_KEY, { date: today, ids: fresh });

  if (!persisted) return { today, visits: [], streak: { current: 0, best: 0 }, seen: unlocked.seen, fresh, rewards: [], newRewards: [] };

  const prev = parseRewards(read(storage, REWARDS_KEY));
  const streak = visitStreak(visits, today);
  const best = Math.max(streak.best, prev.best);
  const rewards = earnedSteps(best);
  const newRewards = rewards.filter((step) => !prev.steps.includes(step));
  if (newRewards.length > 0 || best !== prev.best) write(storage, REWARDS_KEY, { steps: rewards, best });
  return { today, visits, streak: { current: streak.current, best }, seen: unlocked.seen, fresh, rewards, newRewards };
}
