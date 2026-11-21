// Чистые функции «лунной сцены» месяца: путь Луны по небу и счётчик до ближайшей фазы. Без зависимостей от расчёта Луны, чтобы подходить браузеру

// Положение Луны на дуге от восхода (0) до захода (1) в момент nowMin; время — в минутах от полуночи по Москве.
// Луна может взойти вечером, а зайти утром следующего дня: длительность считается через сутки. Вне дуги (Луна под горизонтом) — null
export function arcProgress(riseMin: number | null, setMin: number | null, nowMin: number): number | null {
  if (riseMin === null || setMin === null) return null;
  const duration = (setMin - riseMin + 1440) % 1440;
  if (duration === 0) return null;
  const progress = ((nowMin - riseMin + 1440) % 1440) / duration;
  return progress <= 1 ? progress : null;
}

// «3 д 4 ч», «5 ч 12 мин», «12 мин»; для прошедшего или нулевого времени — «меньше минуты»
export function countdownLabel(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "меньше минуты";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return `${days} д ${hours} ч`;
  if (hours > 0) return `${hours} ч ${rest} мин`;
  return `${rest} мин`;
}

export type StageEvent = { at: number; genitive: string };

// Ближайшее после `now` событие из списка месяца и первого события следующего месяца
export function nextStageEvent(events: readonly StageEvent[], after: StageEvent | null, now: number): StageEvent | null {
  return [...events, ...(after ? [after] : [])].filter((event) => event.at > now).sort((a, b) => a.at - b.at)[0] ?? null;
}

const MOSCOW_OFFSET_MS = 3 * 3_600_000;

// Минуты от полуночи по Москве для момента `ms`
export const moscowMinutes = (ms: number): number => Math.floor((((ms + MOSCOW_OFFSET_MS) % 86_400_000) + 86_400_000) % 86_400_000 / 60_000);
