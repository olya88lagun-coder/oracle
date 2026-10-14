# План 7 — Натальная карта (бесплатная часть)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Открыть практику «Натальная карта»: калькулятор `/natalnaya-karta` по дате, времени и месту рождения с колесом карты, таблицей позиций, аспектами и текстами для Солнца, Луны и асцендента, плюс справочник страниц «планета в знаке» — без регистрации и без передачи даты, времени и места на сервер.

**Architecture:** Астрономия и время — чистые функции в `packages/core/src/natal/` (отдельная точка входа `@oracle/core/natal`, чтобы `astronomy-engine` не попал в остальные страницы). Города — новый пакет `packages/geo` со своей базой и функцией поиска; на сервер уходит только текст поиска (`/api/cities`). Расчёт идёт в браузере; тексты позиций — в `packages/content` по конвейеру арканов и Таро; страницы выходят только для принятых владелицей партий текстов.

**Tech Stack:** TypeScript, `astronomy-engine` 2.1.19 (MIT), `Intl` (база IANA), GeoNames (CC BY 4.0), Next.js 16, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-natal-chart-design.md` (решения D1–D9). Образцы: `packages/core/src/matrix.ts` и `compatibility.ts` (чистое ядро с тестами), `packages/content/src/tarot-*.ts` (разбор и проверка текстов), `apps/web/src/lib/taro-paths.ts` (пути), `apps/web/src/components/taro/*` (экраны).

## Global Constraints

- Дата, время и место рождения не уходят на сервер, пока человек не нажал «Сохранить в портрет» (задача 9). На сервер уходит только текст поиска города; текст запроса не логируется приложением.
- Внешние CDN, шрифты, геокодеры и скрипты со сторонних доменов не подключать (152-ФЗ). Данные городов, глифы и картинки — с нашего домена.
- Язык текстов: «вы», нейтральный род, гипотезы, без предсказаний, сроков, диагнозов и запугивания; тексты проходят `findStopPhrases` (`packages/content/src/check.ts`). На странице результата и в подвале — действующий `DISCLAIMER`.
- Диапазон дат рождения: с 1 января 1900 до сегодняшнего дня.
- Мобильные в приоритете: 375 px без горизонтальной прокрутки, текст не мельче 14 px, зоны нажатия не меньше 44 px; фокус виден; анимации с `@media (prefers-reduced-motion: reduce)`; контраст не ниже WCAG AA.
- Тексты интерфейса дословно (добавить в `AGENTS.md`, задача 10): `<h1>` калькулятора — «Натальная карта»; поля «Дата рождения», «Время рождения», «Место рождения»; флажок «Время рождения неизвестно»; кнопки «Рассчитать карту», «Сохранить в портрет», «Поделиться»; результат — `<section aria-labelledby>` с заголовком «Ваша натальная карта»; сообщение после расчёта — `role="status"`, ошибки — `role="alert"`; ровно один `<h1>` на странице.
- Цели Метрики: `natal_calculated`, `natal_save_click`, `natal_share`, `natal_to_calculator`; без параметров — ни даты, ни времени, ни города.
- Покрытие тестами ≥ 80 %. Коммиты — conventional commits на английском (`feat(core): …`, `feat(web): …`, `content(natal): …`).
- Мерж в `master` сразу выкладывает сайт — мержит только владелица. Не публиковать страницы с текстами, которые она ещё не приняла.

## Review Focus

Что спецификация подразумевает, но чего не проверяют основные тесты; каждая строка получает свой тест в указанной задаче.

1. **Время «в зазоре» и «дважды» при переводе часов** (СССР 1981–1991, Москва 01.04.1981 00:30 и 30.09.1990 02:30): человек не должен молча получить карту «не на то время». Сдвиг вперёд с объяснением; для повтора — выбор «первый раз / второй раз». Задачи 1 и 7.
2. **Города за полярным кругом** (Мурманск 68,96° с. ш.): асцендент считается без NaN, дома по знакам, но около горизонта асцендент «прыгает» на десятки градусов за минуты — показываем пояснение. Задачи 3 и 7.
3. **Долгота западнее 180° (Уэлен, −169,8°) и Южное полушарие**: формулы не должны ломаться на знаке долготы. Задача 4.
4. **Время неизвестно**: в результате нет асцендента, МС, домов и «домовых» фраз; для тел, сменивших знак в течение суток, — явное предупреждение; никакого «приблизительного» асцендента. Задачи 4 и 7.
5. **Названия городов**: омонимы («Новгород», «Александров»), буква ё/е, дефисы («Ростов-на-Дону»), регистр, пустой и однобуквенный запрос, слишком длинный запрос, частые запросы (ограничение частоты). Задача 5.

---

## Структура файлов

| Файл | Ответственность |
|---|---|
| `packages/core/src/natal/zodiac.ts`, `time.ts` (+ tests) | Знаки и градусы; местное время → UTC с зазорами и повторами |
| `packages/core/src/natal/bodies.ts`, `angles.ts`, `aspects.ts` (+ tests) | Положения тел, асцендент и МС, дома по знакам, аспекты |
| `packages/core/src/natal/chart.ts`, `index.ts`, `reference-charts.json`, `reference.test.ts` | Карта целиком, вход `@oracle/core/natal`, эталоны |
| `packages/geo/**` | База городов, сборка из GeoNames, поиск |
| `apps/web/src/app/api/cities/route.ts` (+ test) | Поиск городов |
| `packages/content/src/natal-manifest.ts`, `natal.ts`, `natal-check.ts`, `natal-texts.ts`, `packages/content/natal/*.md`, `scripts/build-arcana.mjs` | Манифест страниц, разбор и проверка текстов, сами тексты |
| `apps/web/src/lib/natal-input.ts`, `natal-paths.ts`, `natal-wheel.ts` (+ tests) | Проверка ввода, пути, геометрия колеса |
| `apps/web/src/components/natal/*`, `apps/web/src/app/natalnaya-karta/**` | Экраны |
| `packages/db/src/schema.ts`, `profiles.ts`, `drizzle/*`, `apps/web/src/app/api/profile/birth-place/route.ts` | Сохранение времени и места (после гейта) |
| `apps/web/src/lib/practices.ts`, `seo.ts`, `analytics.ts`, `AGENTS.md`, `docs/analytics-goals.md`, `e2e/natal.spec.ts` | Связки, документы, проверки |

## Гейты владелицы (до начала кода)

- [ ] **G1. Решения D1–D4 и D6:** дома по знакам, средний узел, база GeoNames, объём первой партии текстов (рекомендация: Солнце, Луна, асцендент — 36 текстов, плюс 12 коротких о домах и 5 об аспектах).
- [ ] **G2. Спрос и риск шаблонных страниц (D9):** замеры Wordstat по запросам вида «солнце в овне», «луна в тельце», «асцендент в весах», «натальная карта онлайн» — до задачи 8.
- [ ] **G3. Юридическое решение по времени и месту рождения (D8):** до задачи 9. Задачи 1–8 и 10 от него не зависят.

---

### Task 1: Знаки и местное время

**Files:**
- Create: `packages/core/src/natal/zodiac.ts`, `packages/core/src/natal/zodiac.test.ts`, `packages/core/src/natal/time.ts`, `packages/core/src/natal/time.test.ts`

**Interfaces:**
- Produces: `SIGNS`, `type SignId`, `normalizeDegrees(value: number): number`, `signOf(longitude): { sign: SignId; index: number; degree: number }`, `angularDistance(a, b): number` (0…180); `type LocalDateTime = { year; month; day; hour; minute }`, `type LocalToUtc = { kind: "ok"; utc: Date } | { kind: "gap"; utc: Date } | { kind: "ambiguous"; utc: Date; alternative: Date }`, `isValidZone(zone: string): boolean`, `utcOffsetMinutes(zone, ms): number`, `localToUtc(zone, local): LocalToUtc`.

- [ ] **Step 1: Тесты знаков**

`packages/core/src/natal/zodiac.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { angularDistance, normalizeDegrees, signOf } from "./zodiac";

describe("signOf", () => {
  test("puts 0° at the start of Aries and 30° at the start of Taurus", () => {
    expect(signOf(0)).toMatchObject({ sign: "aries", index: 0, degree: 0 });
    expect(signOf(29.999).sign).toBe("aries");
    expect(signOf(30)).toMatchObject({ sign: "taurus", index: 1, degree: 0 });
  });

  test("wraps negative and full-circle values", () => {
    expect(signOf(-1)).toMatchObject({ sign: "pisces" });
    expect(signOf(-1).degree).toBeCloseTo(29, 9);
    expect(signOf(360).sign).toBe("aries");
    expect(signOf(725).sign).toBe("aries");
  });
});

describe("angularDistance", () => {
  test("takes the short way around the circle", () => {
    expect(angularDistance(350, 10)).toBe(20);
    expect(angularDistance(10, 350)).toBe(20);
    expect(angularDistance(0, 180)).toBe(180);
    expect(angularDistance(90, 90)).toBe(0);
  });
});

test("normalizeDegrees keeps the value in 0…360", () => {
  expect(normalizeDegrees(-30)).toBe(330);
  expect(normalizeDegrees(360)).toBe(0);
});
```

- [ ] **Step 2: Запустить — должно упасть**

Run: `pnpm --filter @oracle/core exec vitest run src/natal/zodiac.test.ts` (или `pnpm test packages/core/src/natal/zodiac.test.ts`)
Expected: FAIL — модуль `./zodiac` не найден.

- [ ] **Step 3: Реализация**

`packages/core/src/natal/zodiac.ts`:

```ts
export const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const;
export type SignId = (typeof SIGNS)[number];

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function signOf(longitude: number): { sign: SignId; index: number; degree: number } {
  const normalized = normalizeDegrees(longitude);
  const index = Math.floor(normalized / 30);
  return { sign: SIGNS[index], index, degree: normalized - index * 30 };
}

// Наименьшая угловая разница двух долгот, 0…180
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}
```

- [ ] **Step 4: Тесты времени**

Ожидаемые значения проверены на Node 24.20 (tzdata 2026c): в Москве летнее время вводили 01.04.1981 (с 00:00 сразу 01:00), отменили 30.09.1990 (с 03:00 назад на 02:00); у Новосибирска с 26.03.2011 было +7, с 26.10.2014 — +6.

`packages/core/src/natal/time.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { isValidZone, localToUtc, utcOffsetMinutes } from "./time";

const at = (year: number, month: number, day: number, hour: number, minute: number) => ({ year, month, day, hour, minute });

describe("localToUtc", () => {
  test("converts an ordinary moment with the historical offset", () => {
    expect(localToUtc("Europe/Moscow", at(1990, 3, 7, 12, 0))).toEqual({ kind: "ok", utc: new Date("1990-03-07T09:00:00Z") });
    expect(localToUtc("Europe/Moscow", at(2012, 7, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2012-07-01T08:00:00Z") });
    expect(localToUtc("Europe/Moscow", at(2015, 1, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2015-01-01T09:00:00Z") });
  });

  test("follows the zone changes of one city (Novosibirsk +7 in 2011, +6 since 2014)", () => {
    expect(localToUtc("Asia/Novosibirsk", at(2011, 7, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2011-07-01T05:00:00Z") });
    expect(localToUtc("Asia/Novosibirsk", at(2015, 1, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2015-01-01T06:00:00Z") });
  });

  test("reports a time that never existed and moves it forward by the gap", () => {
    // 01.04.1981 в Москве часы с 00:00 перевели на 01:00: 00:30 не было
    const result = localToUtc("Europe/Moscow", at(1981, 4, 1, 0, 30));
    expect(result.kind).toBe("gap");
    expect(result.utc.toISOString()).toBe("1981-03-31T21:30:00.000Z"); // = 01:30 по новому времени
  });

  test("reports a time that happened twice and offers both instants", () => {
    // 30.09.1990 в Москве часы с 03:00 перевели на 02:00: 02:30 было дважды
    const result = localToUtc("Europe/Moscow", at(1990, 9, 30, 2, 30));
    expect(result.kind).toBe("ambiguous");
    if (result.kind !== "ambiguous") return;
    expect(result.utc.toISOString()).toBe("1990-09-29T22:30:00.000Z");
    expect(result.alternative.toISOString()).toBe("1990-09-29T23:30:00.000Z");
  });
});

test("utcOffsetMinutes gives the historical offset", () => {
  expect(utcOffsetMinutes("Europe/Moscow", Date.UTC(1985, 6, 1))).toBe(240);
  expect(utcOffsetMinutes("Europe/Moscow", Date.UTC(1975, 5, 1))).toBe(180);
});

test("isValidZone accepts IANA names and rejects anything else", () => {
  expect(isValidZone("Europe/Moscow")).toBe(true);
  expect(isValidZone("Not/AZone")).toBe(false);
  expect(isValidZone("")).toBe(false);
});
```

- [ ] **Step 5: Запустить — должно упасть**

Run: `pnpm test packages/core/src/natal/time.test.ts`
Expected: FAIL — модуль `./time` не найден.

- [ ] **Step 6: Реализация**

`packages/core/src/natal/time.ts`:

```ts
export type LocalDateTime = { year: number; month: number; day: number; hour: number; minute: number };

export type LocalToUtc =
  | { kind: "ok"; utc: Date }
  | { kind: "gap"; utc: Date }
  | { kind: "ambiguous"; utc: Date; alternative: Date };

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

// Смещение зоны от UTC в минутах в момент ms (по базе часовых поясов, включая исторические правила)
export function utcOffsetMinutes(zone: string, ms: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - Math.floor(ms / 1000) * 1000) / MINUTE_MS;
}

// Местное время рождения → момент в UTC.
// gap: такого времени не было (часы перевели вперёд) — берём смещение до перевода, время «сдвигается» вперёд.
// ambiguous: время было дважды (часы перевели назад) — utc это первый раз, alternative — второй.
export function localToUtc(zone: string, local: LocalDateTime): LocalToUtc {
  const guess = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const offsets = [...new Set([utcOffsetMinutes(zone, guess - DAY_MS), utcOffsetMinutes(zone, guess + DAY_MS)])];
  const valid = offsets
    .map((offset) => guess - offset * MINUTE_MS)
    .filter((candidate) => utcOffsetMinutes(zone, candidate) === (guess - candidate) / MINUTE_MS)
    .sort((a, b) => a - b);
  if (valid.length === 1) return { kind: "ok", utc: new Date(valid[0]) };
  if (valid.length >= 2) return { kind: "ambiguous", utc: new Date(valid[0]), alternative: new Date(valid[1]) };
  return { kind: "gap", utc: new Date(guess - Math.min(...offsets) * MINUTE_MS) };
}
```

- [ ] **Step 7: Запустить — должно пройти**

Run: `pnpm test packages/core/src/natal`
Expected: PASS (zodiac и time).

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/natal/zodiac.ts packages/core/src/natal/zodiac.test.ts packages/core/src/natal/time.ts packages/core/src/natal/time.test.ts
git commit -m "feat(core): zodiac helpers and local birth time to UTC with clock-change gaps"
```

---

### Task 2: Положения тел

**Files:**
- Create: `packages/core/src/natal/bodies.ts`, `packages/core/src/natal/bodies.test.ts`
- Modify: `packages/core/package.json` (зависимость)

**Interfaces:**
- Consumes: `normalizeDegrees`, `angularDistance` (задача 1).
- Produces: `BODIES` (`"sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto"`), `type BodyId`, `eclipticLongitude(body, date): number` (видимая геоцентрическая, 0…360), `isRetrograde(body, date): boolean`, `meanLunarNode(date): number` (восходящий).

- [ ] **Step 1: Добавить зависимость**

Run: `pnpm --filter @oracle/core add astronomy-engine@2.1.19`
Expected: в `packages/core/package.json` появилась `"astronomy-engine": "2.1.19"`, `pnpm-lock.yaml` обновлён.

- [ ] **Step 2: Тесты**

Эталоны независимы от нашего кода: равноденствие и солнцестояние 2024 (USNO: 20.03 03:06 UTC, 20.06 20:51 UTC); периоды обратного движения Меркурия (01–25.04.2024) и Марса (06.12.2024 – 24.02.2025) из публичных календарей; средний узел на J2000 — константа формулы.

`packages/core/src/natal/bodies.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { BODIES, eclipticLongitude, isRetrograde, meanLunarNode } from "./bodies";
import { angularDistance } from "./zodiac";

describe("eclipticLongitude", () => {
  test("puts the Sun at 0° at the 2024 March equinox and 90° at the June solstice", () => {
    expect(angularDistance(eclipticLongitude("sun", new Date("2024-03-20T03:06:00Z")), 0)).toBeLessThan(0.02);
    expect(angularDistance(eclipticLongitude("sun", new Date("2024-06-20T20:51:00Z")), 90)).toBeLessThan(0.02);
  });

  test("is geocentric: Mars on 1990-03-07 is near 296.85°, not near its heliocentric 265.7°", () => {
    expect(Math.abs(eclipticLongitude("mars", new Date("1990-03-07T09:00:00Z")) - 296.85)).toBeLessThan(0.05);
  });

  test("returns a finite 0…360 value for every body", () => {
    for (const body of BODIES) {
      const value = eclipticLongitude(body, new Date("1990-03-07T09:00:00Z"));
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(360);
    }
  });
});

describe("isRetrograde", () => {
  test("Mercury is retrograde in April 2024 and direct in mid-May", () => {
    expect(isRetrograde("mercury", new Date("2024-04-10T12:00:00Z"))).toBe(true);
    expect(isRetrograde("mercury", new Date("2024-05-15T12:00:00Z"))).toBe(false);
  });

  test("Mars is retrograde in January 2025", () => {
    expect(isRetrograde("mars", new Date("2025-01-15T12:00:00Z"))).toBe(true);
  });

  test("the Sun and the Moon never are", () => {
    expect(isRetrograde("sun", new Date("2024-04-10T12:00:00Z"))).toBe(false);
    expect(isRetrograde("moon", new Date("2024-04-10T12:00:00Z"))).toBe(false);
  });
});

describe("meanLunarNode", () => {
  test("matches the formula constant at J2000 and moves backwards", () => {
    expect(meanLunarNode(new Date("2000-01-01T12:00:00Z"))).toBeCloseTo(125.04452, 3);
    expect(angularDistance(meanLunarNode(new Date("2000-01-31T12:00:00Z")), 125.04452)).toBeCloseTo(1.59, 1);
  });
});
```

(1,59° — это 30 суток × 0,0529°/сут: средний узел сдвигается назад на 19,34°/год.)

- [ ] **Step 3: Запустить — должно упасть**

Run: `pnpm test packages/core/src/natal/bodies.test.ts`
Expected: FAIL — модуль `./bodies` не найден.

- [ ] **Step 4: Реализация**

`packages/core/src/natal/bodies.ts`:

```ts
import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac";

export const BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
export type BodyId = (typeof BODIES)[number];

const ASTRONOMY_BODY: Record<Exclude<BodyId, "sun" | "moon">, Astronomy.Body> = {
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

// Видимая геоцентрическая эклиптическая долгота, градусы 0…360.
// Не использовать Astronomy.EclipticLongitude: она гелиоцентрическая (у Марса разница около 30°).
export function eclipticLongitude(body: BodyId, date: Date): number {
  const time = Astronomy.MakeTime(date);
  if (body === "sun") return normalizeDegrees(Astronomy.SunPosition(time).elon);
  if (body === "moon") return normalizeDegrees(Astronomy.EclipticGeoMoon(time).lon);
  return normalizeDegrees(Astronomy.Ecliptic(Astronomy.GeoVector(ASTRONOMY_BODY[body], time, true)).elon);
}

// Обратное движение: долгота за сутки уменьшается. У Солнца и Луны его нет.
export function isRetrograde(body: BodyId, date: Date): boolean {
  if (body === "sun" || body === "moon") return false;
  const halfDay = 12 * 3_600_000;
  let delta = eclipticLongitude(body, new Date(date.getTime() + halfDay)) - eclipticLongitude(body, new Date(date.getTime() - halfDay));
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

// Средний восходящий узел Луны (формула Мееуса). Южный узел — на 180° от него.
export function meanLunarNode(date: Date): number {
  const centuries = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000 / 36_525;
  return normalizeDegrees(125.04452 - 1934.136261 * centuries);
}
```

- [ ] **Step 5: Запустить — должно пройти**

Run: `pnpm test packages/core/src/natal/bodies.test.ts && pnpm --filter @oracle/core typecheck`
Expected: PASS, типы без ошибок.

- [ ] **Step 6: Commit**

```bash
git add packages/core/package.json pnpm-lock.yaml packages/core/src/natal/bodies.ts packages/core/src/natal/bodies.test.ts
git commit -m "feat(core): geocentric ecliptic longitudes, retrograde flag and mean lunar node"
```

---

### Task 3: Асцендент, дома и аспекты

**Files:**
- Create: `packages/core/src/natal/angles.ts`, `angles.test.ts`, `aspects.ts`, `aspects.test.ts`

**Interfaces:**
- Consumes: `normalizeDegrees`, `signOf`, `angularDistance` (задача 1), `BodyId`, `BODIES` (задача 2).
- Produces: `ascendantAndMidheaven(date, latitude, longitude): { ascendant: number; midheaven: number }` (долгота на восток положительна), `wholeSignHouse(longitude, ascendant): number` (1…12); `ASPECTS`, `type AspectId`, `type Aspect = { a: BodyId; b: BodyId; aspect: AspectId; orb: number }`, `findAspects(longitudes: Readonly<Record<BodyId, number>>, bodies: readonly BodyId[]): Aspect[]`.

- [ ] **Step 1: Тесты углов**

Независимые физические проверки: в верхней кульминации Солнца МС равен долготе Солнца; в момент восхода асцендент впереди Солнца на 0,83°/sin(угла эклиптики к горизонту) — на осеннем равноденствии это 0,9–1,2° для широт 43–69° (проверено: Москва 0,98°, Сочи 0,88°, Мурманск 1,18°, Уэлен 1,13°). Для этого нужны функции самой `astronomy-engine` (`SearchHourAngle`, `SearchRiseSet`) — их использует только тест.

`packages/core/src/natal/angles.test.ts`:

```ts
import * as Astronomy from "astronomy-engine";
import { describe, expect, test } from "vitest";
import { ascendantAndMidheaven, wholeSignHouse } from "./angles";
import { eclipticLongitude } from "./bodies";
import { angularDistance } from "./zodiac";

const PLACES = [
  { name: "Москва", latitude: 55.7558, longitude: 37.6173 },
  { name: "Новосибирск", latitude: 55.0084, longitude: 82.9357 },
  { name: "Сочи", latitude: 43.5855, longitude: 39.7231 },
  { name: "Мурманск", latitude: 68.9585, longitude: 33.0827 },
  { name: "Уэлен (западная долгота)", latitude: 66.15, longitude: -169.8 },
  { name: "Буэнос-Айрес (юг)", latitude: -34.6, longitude: -58.38 },
];

describe("ascendantAndMidheaven", () => {
  test.each(PLACES)("the midheaven equals the Sun's longitude at the Sun's culmination: $name", ({ latitude, longitude }) => {
    for (const day of ["1990-03-07T00:00:00Z", "2005-09-23T00:00:00Z", "1978-12-21T00:00:00Z"]) {
      const observer = new Astronomy.Observer(latitude, longitude, 0);
      const culmination = Astronomy.SearchHourAngle(Astronomy.Body.Sun, observer, 0, new Date(day)).time.date;
      const { midheaven } = ascendantAndMidheaven(culmination, latitude, longitude);
      expect(angularDistance(midheaven, eclipticLongitude("sun", culmination))).toBeLessThan(0.01);
    }
  });

  test.each(PLACES.filter((place) => place.latitude > 0))(
    "the ascendant is just ahead of the Sun at sunrise on the September equinox: $name",
    ({ latitude, longitude }) => {
      const observer = new Astronomy.Observer(latitude, longitude, 0);
      const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, new Date("2005-09-23T00:00:00Z"), 2)!.date;
      const { ascendant } = ascendantAndMidheaven(sunrise, latitude, longitude);
      const ahead = angularDistance(ascendant, eclipticLongitude("sun", sunrise));
      expect(ahead).toBeGreaterThan(0.5);
      expect(ahead).toBeLessThan(1.6);
    },
  );

  test("the midheaven is always 0…180° behind the ascendant, and nothing is NaN at the polar circle", () => {
    for (let hour = 0; hour < 24; hour += 0.5) {
      const { ascendant, midheaven } = ascendantAndMidheaven(new Date(Date.UTC(1990, 2, 7, hour)), 55.75, 37.62);
      const behind = (((ascendant - midheaven) % 360) + 360) % 360;
      expect(behind).toBeGreaterThan(0);
      expect(behind).toBeLessThan(180);
      expect(Number.isFinite(ascendantAndMidheaven(new Date(Date.UTC(1990, 2, 7, hour)), 68.97, 33.08).ascendant)).toBe(true);
    }
  });
});

describe("wholeSignHouse", () => {
  test("counts houses by signs starting from the ascendant sign", () => {
    expect(wholeSignHouse(10, 15)).toBe(1); // тот же знак, что у асцендента
    expect(wholeSignHouse(40, 15)).toBe(2);
    expect(wholeSignHouse(5, 15)).toBe(1);
    expect(wholeSignHouse(350, 15)).toBe(12);
    expect(wholeSignHouse(195, 15)).toBe(7);
  });
});
```

- [ ] **Step 2: Запустить — упасть**

Run: `pnpm test packages/core/src/natal/angles.test.ts`
Expected: FAIL — модуль `./angles` не найден.

- [ ] **Step 3: Реализация**

`packages/core/src/natal/angles.ts`:

```ts
import * as Astronomy from "astronomy-engine";
import { normalizeDegrees, signOf } from "./zodiac";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// Асцендент и МС (середина неба) для момента UTC и географических координат (долгота на восток положительна)
export function ascendantAndMidheaven(date: Date, latitude: number, longitude: number): { ascendant: number; midheaven: number } {
  const time = Astronomy.MakeTime(date);
  const obliquity = Astronomy.e_tilt(time).tobl * RAD;
  const ramc = normalizeDegrees(Astronomy.SiderealTime(time) * 15 + longitude) * RAD;
  const ascendant = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(obliquity) + Math.tan(latitude * RAD) * Math.sin(obliquity))) * DEG;
  const midheaven = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(obliquity)) * DEG;
  return { ascendant: normalizeDegrees(ascendant), midheaven: normalizeDegrees(midheaven) };
}

// Дома по знакам: первый дом — знак асцендента, дальше по порядку.
// Работает на любой широте (Плацидус за полярным кругом не определён)
export function wholeSignHouse(longitude: number, ascendant: number): number {
  return ((signOf(longitude).index - signOf(ascendant).index + 12) % 12) + 1;
}
```

- [ ] **Step 4: Тесты аспектов**

`packages/core/src/natal/aspects.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { findAspects } from "./aspects";
import { BODIES, type BodyId } from "./bodies";

// Все тела разнесены далеко друг от друга, затем нужные двигаем в тест
const spread = (overrides: Partial<Record<BodyId, number>>): Record<BodyId, number> =>
  ({ ...Object.fromEntries(BODIES.map((body, index) => [body, 5 + index * 31.7])), ...overrides }) as Record<BodyId, number>;

describe("findAspects", () => {
  test("finds a conjunction of the luminaries within 8° and nothing beyond", () => {
    const near = findAspects(spread({ sun: 100, moon: 107.9 }), ["sun", "moon"]);
    expect(near).toHaveLength(1);
    expect(near[0]).toMatchObject({ a: "sun", b: "moon", aspect: "conjunction" });
    expect(near[0].orb).toBeCloseTo(7.9, 6);
    expect(findAspects(spread({ sun: 100, moon: 108.1 }), ["sun", "moon"])).toEqual([]);
  });

  test("uses 6° for two slow planets", () => {
    expect(findAspects(spread({ uranus: 10, neptune: 15.9 }), ["uranus", "neptune"])).toHaveLength(1);
    expect(findAspects(spread({ uranus: 10, neptune: 16.1 }), ["uranus", "neptune"])).toEqual([]);
  });

  test("measures across 0°/360° and recognises an opposition", () => {
    const found = findAspects(spread({ mars: 350, venus: 170 }), ["mars", "venus"]);
    expect(found).toEqual([{ a: "mars", b: "venus", aspect: "opposition", orb: 0 }]);
  });

  test("finds trine, square and sextile and sorts the tightest first", () => {
    const found = findAspects(spread({ sun: 0, moon: 92, mercury: 121, venus: 59 }), ["sun", "moon", "mercury", "venus"]);
    const keys = found.map((item) => `${item.a}-${item.b}:${item.aspect}`);
    expect(keys).toContain("sun-moon:square");
    expect(keys).toContain("sun-mercury:trine");
    expect(keys).toContain("sun-venus:sextile");
    expect(found.map((item) => item.orb)).toEqual([...found.map((item) => item.orb)].sort((x, y) => x - y));
  });
});
```

- [ ] **Step 5: Реализация**

`packages/core/src/natal/aspects.ts`:

```ts
import { type BodyId } from "./bodies";
import { angularDistance } from "./zodiac";

export const ASPECTS = [
  { id: "conjunction", angle: 0 },
  { id: "sextile", angle: 60 },
  { id: "square", angle: 90 },
  { id: "trine", angle: 120 },
  { id: "opposition", angle: 180 },
] as const;
export type AspectId = (typeof ASPECTS)[number]["id"];

export type Aspect = { a: BodyId; b: BodyId; aspect: AspectId; orb: number };

const LUMINARY_ORB = 8;
const OTHER_ORB = 6;
const maxOrb = (body: BodyId) => (body === "sun" || body === "moon" ? LUMINARY_ORB : OTHER_ORB);

// Мажорные аспекты; допуск — больший из допусков двух тел; сначала самые точные
export function findAspects(longitudes: Readonly<Record<BodyId, number>>, bodies: readonly BodyId[]): Aspect[] {
  const found: Aspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const distance = angularDistance(longitudes[bodies[i]], longitudes[bodies[j]]);
      const allowed = Math.max(maxOrb(bodies[i]), maxOrb(bodies[j]));
      for (const aspect of ASPECTS) {
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= allowed) found.push({ a: bodies[i], b: bodies[j], aspect: aspect.id, orb });
      }
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}
```

- [ ] **Step 6: Запустить — должно пройти**

Run: `pnpm test packages/core/src/natal && pnpm --filter @oracle/core typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/natal/angles.ts packages/core/src/natal/angles.test.ts packages/core/src/natal/aspects.ts packages/core/src/natal/aspects.test.ts
git commit -m "feat(core): ascendant, midheaven, whole-sign houses and major aspects"
```

---

### Task 4: Карта целиком и эталоны

**Files:**
- Create: `packages/core/src/natal/chart.ts`, `chart.test.ts`, `index.ts`, `reference-charts.json`, `reference.test.ts`
- Modify: `packages/core/package.json` (подпуть `./natal`). В `packages/core/src/index.ts` модуль `natal` **не** добавляется — иначе `astronomy-engine` попадёт во все страницы

**Interfaces:**
- Consumes: всё из задач 1–3.
- Produces: `type BirthMoment = { instant: Date; latitude: number; longitude: number; timeKnown: boolean }`, `type ChartPoint = { id: BodyId | "northNode"; longitude; sign: SignId; degree; retrograde; house: number | null }`, `type ChartAngle = { longitude; sign; degree }`, `type NatalChart = { points: ChartPoint[]; ascendant: ChartAngle | null; midheaven: ChartAngle | null; aspects: Aspect[]; uncertainSigns: BodyId[] }`, `computeNatalChart(moment): NatalChart` (бросает `RangeError` на неверный момент и координаты); `index.ts` реэкспортирует всё из `natal/*`.

- [ ] **Step 1: Тесты**

`packages/core/src/natal/chart.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { computeNatalChart } from "./chart";

const MOSCOW = { latitude: 55.7558, longitude: 37.6173 };
const find = (chart: ReturnType<typeof computeNatalChart>, id: string) => chart.points.find((point) => point.id === id)!;

describe("computeNatalChart", () => {
  test("Moscow, 7 March 1990 12:00 MSK: Sun in Pisces, Moon in Cancer, Jupiter in Cancer, retrograde Pluto in Scorpio", () => {
    const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), ...MOSCOW, timeKnown: true });
    expect(find(chart, "sun")).toMatchObject({ sign: "pisces", retrograde: false });
    expect(find(chart, "sun").degree).toBeCloseTo(16.5, 0);
    expect(find(chart, "moon").sign).toBe("cancer");
    expect(find(chart, "jupiter").sign).toBe("cancer");
    expect(find(chart, "pluto")).toMatchObject({ sign: "scorpio", retrograde: true });
    expect(chart.ascendant).not.toBeNull();
    expect(chart.midheaven?.sign).toBe("pisces");
    expect(chart.points.every((point) => point.house !== null && point.house >= 1 && point.house <= 12)).toBe(true);
    expect(find(chart, "northNode").retrograde).toBe(true);
  });

  test("without a birth time there is no ascendant, midheaven or houses, and signs changed within the day are listed", () => {
    const chart = computeNatalChart({ instant: new Date("2024-03-20T09:00:00Z"), ...MOSCOW, timeKnown: false });
    expect(chart.ascendant).toBeNull();
    expect(chart.midheaven).toBeNull();
    expect(chart.points.every((point) => point.house === null)).toBe(true);
    expect(chart.uncertainSigns).toContain("sun"); // 20 марта 2024 Солнце перешло из Рыб в Овен
  });

  test("with a known time nothing is reported as uncertain", () => {
    expect(computeNatalChart({ instant: new Date("2024-03-20T09:00:00Z"), ...MOSCOW, timeKnown: true }).uncertainSigns).toEqual([]);
  });

  test("works at the polar circle, west of 180° and in the Southern Hemisphere", () => {
    for (const place of [
      { latitude: 68.9585, longitude: 33.0827 },
      { latitude: 66.15, longitude: -169.8 },
      { latitude: -34.6, longitude: -58.38 },
    ]) {
      const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), ...place, timeKnown: true });
      expect(Number.isFinite(chart.ascendant!.longitude)).toBe(true);
      expect(chart.points.every((point) => Number.isFinite(point.longitude))).toBe(true);
    }
  });

  test("rejects an invalid moment and impossible coordinates", () => {
    expect(() => computeNatalChart({ instant: new Date(NaN), latitude: 0, longitude: 0, timeKnown: true })).toThrow(RangeError);
    expect(() => computeNatalChart({ instant: new Date(), latitude: 91, longitude: 0, timeKnown: true })).toThrow(RangeError);
    expect(() => computeNatalChart({ instant: new Date(), latitude: 0, longitude: 181, timeKnown: true })).toThrow(RangeError);
    expect(() => computeNatalChart({ instant: new Date(), latitude: Number.NaN, longitude: 0, timeKnown: true })).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: Запустить — упасть**

Run: `pnpm test packages/core/src/natal/chart.test.ts`
Expected: FAIL — модуль `./chart` не найден.

- [ ] **Step 3: Реализация**

`packages/core/src/natal/chart.ts`:

```ts
import { ascendantAndMidheaven, wholeSignHouse } from "./angles";
import { findAspects, type Aspect } from "./aspects";
import { BODIES, eclipticLongitude, isRetrograde, meanLunarNode, type BodyId } from "./bodies";
import { signOf, type SignId } from "./zodiac";

export type BirthMoment = {
  instant: Date; // момент рождения в UTC; если время неизвестно — местный полдень
  latitude: number;
  longitude: number; // на восток положительна
  timeKnown: boolean;
};

export type ChartPoint = {
  id: BodyId | "northNode";
  longitude: number;
  sign: SignId;
  degree: number;
  retrograde: boolean;
  house: number | null;
};
export type ChartAngle = { longitude: number; sign: SignId; degree: number };

export type NatalChart = {
  points: ChartPoint[];
  ascendant: ChartAngle | null; // без времени рождения асцендента, МС и домов нет
  midheaven: ChartAngle | null;
  aspects: Aspect[];
  uncertainSigns: BodyId[]; // без времени: тела, которые в течение суток меняют знак
};

const HALF_DAY_MS = 12 * 3_600_000;
const MAX_LATITUDE = 85;

function placement(longitude: number): { sign: SignId; degree: number } {
  const { sign, degree } = signOf(longitude);
  return { sign, degree };
}

export function computeNatalChart(moment: BirthMoment): NatalChart {
  const { instant, latitude, longitude, timeKnown } = moment;
  if (Number.isNaN(instant.getTime())) throw new RangeError("Некорректный момент рождения");
  if (!(Math.abs(latitude) <= MAX_LATITUDE) || !(Math.abs(longitude) <= 180)) throw new RangeError("Некорректные координаты");

  const angles = timeKnown ? ascendantAndMidheaven(instant, latitude, longitude) : null;
  const longitudes = Object.fromEntries(BODIES.map((body) => [body, eclipticLongitude(body, instant)])) as Record<BodyId, number>;
  const houseOf = (value: number) => (angles ? wholeSignHouse(value, angles.ascendant) : null);

  const points: ChartPoint[] = BODIES.map((body) => ({
    id: body,
    longitude: longitudes[body],
    ...placement(longitudes[body]),
    retrograde: isRetrograde(body, instant),
    house: houseOf(longitudes[body]),
  }));
  const node = meanLunarNode(instant);
  points.push({ id: "northNode", longitude: node, ...placement(node), retrograde: true, house: houseOf(node) });

  const signAt = (body: BodyId, shiftMs: number) => signOf(eclipticLongitude(body, new Date(instant.getTime() + shiftMs))).sign;
  const uncertainSigns = timeKnown ? [] : BODIES.filter((body) => signAt(body, -HALF_DAY_MS) !== signAt(body, HALF_DAY_MS));

  return {
    points,
    ascendant: angles ? { longitude: angles.ascendant, ...placement(angles.ascendant) } : null,
    midheaven: angles ? { longitude: angles.midheaven, ...placement(angles.midheaven) } : null,
    aspects: findAspects(longitudes, BODIES),
    uncertainSigns,
  };
}
```

`packages/core/src/natal/index.ts`:

```ts
export * from "./zodiac";
export * from "./time";
export * from "./bodies";
export * from "./angles";
export * from "./aspects";
export * from "./chart";
```

`packages/core/package.json` — строка `exports` становится:

```json
"exports": { ".": "./src/index.ts", "./natal": "./src/natal/index.ts" },
```

- [ ] **Step 4: Тест «основной вход не тянет астрономию»**

`packages/core/src/natal/entry.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("natal entry point", () => {
  test("the main @oracle/core entry does not import the natal module, so astronomy-engine stays out of other pages", () => {
    const index = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    expect(index).not.toMatch(/natal|astronomy-engine/);
  });
});
```

- [ ] **Step 5: Эталонные карты (независимый источник)**

Снять один раз с JPL Horizons шесть карт: Москва 07.03.1990 12:00 MSK; Новосибирск 01.07.2011 12:00; Анадырь 15.12.1975 08:30; Мурманск 21.12.2000 00:15; Буэнос-Айрес 21.06.1960 18:00; Лондон 01.01.2000 12:00 UTC. По каждой — геоцентрическая видимая долгота Солнца, Луны, Меркурия, Венеры, Марса, Юпитера, Сатурна, Урана, Нептуна, Плутона. В запросе Horizons использовать величину «Observer ecliptic lon & lat»; **проверить по документации Horizons, что долгота отсчитывается от эклиптики и равноденствия даты, а не J2000** — если от J2000, добавить прецессию (≈ 0,0139°/год от 2000) или взять другую величину. Асцендент и МС для тех же карт взять из независимого калькулятора на Swiss Ephemeris (например, astro.com, система домов не важна — нужны только углы). Записать в `packages/core/src/natal/reference-charts.json`:

```json
{
  "source": "JPL Horizons (планеты), Swiss Ephemeris via astro.com (углы)",
  "fetched": "ГГГГ-ММ-ДД",
  "charts": [
    {
      "name": "Москва 07.03.1990 12:00 MSK",
      "instant": "1990-03-07T09:00:00Z",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "longitudes": { "sun": 0, "moon": 0, "mercury": 0, "venus": 0, "mars": 0, "jupiter": 0, "saturn": 0, "uranus": 0, "neptune": 0, "pluto": 0 },
      "ascendant": 0,
      "midheaven": 0
    }
  ]
}
```

(нули — места под снятые числа; файл с нулями не коммитить.)

`packages/core/src/natal/reference.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import reference from "./reference-charts.json";
import { eclipticLongitude, BODIES } from "./bodies";
import { ascendantAndMidheaven } from "./angles";
import { angularDistance } from "./zodiac";

const PLANET_TOLERANCE = 0.03; // около двух угловых минут — для показа «градусы и минуты»
const ANGLE_TOLERANCE = 0.1;

describe.each(reference.charts)("reference chart $name", (chart) => {
  const instant = new Date(chart.instant);

  test.each(BODIES)("%s is within tolerance", (body) => {
    expect(angularDistance(eclipticLongitude(body, instant), chart.longitudes[body])).toBeLessThan(PLANET_TOLERANCE);
  });

  test("ascendant and midheaven are within tolerance", () => {
    const { ascendant, midheaven } = ascendantAndMidheaven(instant, chart.latitude, chart.longitude);
    expect(angularDistance(ascendant, chart.ascendant)).toBeLessThan(ANGLE_TOLERANCE);
    expect(angularDistance(midheaven, chart.midheaven)).toBeLessThan(ANGLE_TOLERANCE);
  });
});
```

Если какое-то тело выходит за допуск — не расширять допуск молча: записать расхождение и решить (скорее всего, источник эталона берёт другую систему отсчёта).

- [ ] **Step 6: Запустить всё ядро**

Run: `pnpm test packages/core && pnpm --filter @oracle/core typecheck && pnpm typecheck`
Expected: PASS; `apps/web` по-прежнему собирается (подпуть `@oracle/core/natal` пока нигде не импортируется).

- [ ] **Step 7: Commit**

```bash
git add packages/core
git commit -m "feat(core): compute a natal chart with reference charts and a separate entry point"
```

---

### Task 5: Города (пакет `geo`)

**Files:**
- Create: `packages/geo/package.json`, `tsconfig.json`, `src/index.ts`, `src/normalize.ts`, `src/search.ts`, `src/types.ts`, `src/search.test.ts`, `src/fixture.ts`, `scripts/build-cities.mjs`, `data/cities.json` (результат сборки), `README.md` (источник и лицензия)
- Create: `apps/web/src/app/api/cities/route.ts`, `apps/web/src/app/api/cities/route.test.ts`
- Modify: `apps/web/next.config.ts` (`transpilePackages` + `@oracle/geo`), `apps/web/package.json` (зависимость `@oracle/geo: workspace:*`), `pnpm-workspace.yaml` при необходимости

**Interfaces:**
- Produces: `type City = { id: number; name: string; region: string; country: string; latitude: number; longitude: number; zone: string; population: number }`; `normalizeQuery(text: string): string`; `buildCityIndex(cities: readonly City[]): CityIndex`; `searchCities(index: CityIndex, query: string, limit?: number): City[]`; `CITIES: readonly City[]` из `data/cities.json`; HTTP `GET /api/cities?q=…` → `{ cities: City[] }` (до 8), `400` на запрос короче 2 или длиннее 40 символов.

- [ ] **Step 1: Данные и лицензия (подготовка, не код)**

Скачать владелицей/разработчиком **вручную** в `C:\dev\geonames\` (не в репозиторий): `cities5000.zip`, `alternateNamesV2.zip`, `admin1CodesASCII.txt` с https://download.geonames.org/export/dump/ (лицензия CC BY 4.0, нужно указание источника). Сверить на странице GeoNames текущие условия лицензии и состав колонок `cities5000.txt` (id, name, asciiname, alternatenames, latitude, longitude, feature class, feature code, country code, admin1 code, population, timezone). Порог 5000 жителей — стартовый: он отсекает села, поэтому в форме есть подсказка «не нашли? укажите ближайший город».

- [ ] **Step 2: Тесты поиска на небольшой фикстуре**

`packages/geo/src/fixture.ts` — 14 городов, включая «Москва», «Великий Новгород», «Нижний Новгород», «Ростов-на-Дону», «Ёлкино» (вымышленное имя для проверки ё), «Мурманск», «Александров», «Александровск-Сахалинский», «Анадырь», «Новосибирск», «Санкт-Петербург», «Сочи», «Буэнос-Айрес», «Уэлен». Население в фикстуре настоящее (Нижний Новгород крупнее Великого Новгорода) — от него зависит порядок в тестах.

`packages/geo/src/search.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { normalizeQuery } from "./normalize";
import { buildCityIndex, searchCities } from "./search";
import { FIXTURE_CITIES } from "./fixture";

const index = buildCityIndex(FIXTURE_CITIES);
const names = (query: string) => searchCities(index, query).map((city) => city.name);

describe("normalizeQuery", () => {
  test("lowercases, treats ё as е and hyphens as spaces, and trims", () => {
    expect(normalizeQuery("  Ёлкино ")).toBe("елкино");
    expect(normalizeQuery("Ростов-на-Дону")).toBe("ростов на дону");
    expect(normalizeQuery("САНКТ—Петербург")).toBe("санкт петербург");
  });
});

describe("searchCities", () => {
  test("finds by the start of any word and ranks bigger cities first", () => {
    expect(names("новгород")).toEqual(["Нижний Новгород", "Великий Новгород"]);
    expect(names("моск")[0]).toBe("Москва");
  });

  test("ignores ё/е, case and hyphens", () => {
    expect(names("елкино")).toEqual(["Ёлкино"]);
    expect(names("РОСТОВ НА ДОНУ")).toEqual(["Ростов-на-Дону"]);
    expect(names("ростов-на")).toEqual(["Ростов-на-Дону"]);
  });

  test("returns homonyms with their region so the person can tell them apart", () => {
    const found = searchCities(index, "александров");
    expect(found.length).toBeGreaterThanOrEqual(2);
    expect(new Set(found.map((city) => `${city.name}|${city.region}`)).size).toBe(found.length);
  });

  test("returns nothing for an empty, one-letter or very long query, and respects the limit", () => {
    expect(names("")).toEqual([]);
    expect(names(" ")).toEqual([]);
    expect(names("м")).toEqual([]);
    expect(names("м".repeat(200))).toEqual([]);
    expect(searchCities(index, "са", 1)).toHaveLength(1);
  });

  test("every city carries coordinates in range and a valid-looking IANA zone", () => {
    for (const city of FIXTURE_CITIES) {
      expect(Math.abs(city.latitude)).toBeLessThanOrEqual(85);
      expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
      expect(city.zone).toMatch(/^[A-Za-z_]+\/[A-Za-z_\/+-]+$/);
    }
  });
});
```

- [ ] **Step 3: Запустить — упасть; реализовать**

`packages/geo/src/normalize.ts`:

```ts
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 40;

export function normalizeQuery(text: string): string {
  return text.toLowerCase().replaceAll("ё", "е").replace(/[-–—]+/g, " ").replace(/\s+/g, " ").trim();
}
```

`packages/geo/src/types.ts`:

```ts
export type City = {
  id: number;
  name: string; // русское название, если нет — латиницей
  region: string; // область или край; для городов-государств может быть пустым
  country: string; // название страны по-русски
  latitude: number;
  longitude: number; // на восток положительна
  zone: string; // IANA, например Europe/Moscow
  population: number;
};
```

`packages/geo/src/search.ts`:

```ts
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, normalizeQuery } from "./normalize";
import type { City } from "./types";

export type CityIndex = { entries: readonly { city: City; words: string[]; full: string }[] };

export function buildCityIndex(cities: readonly City[]): CityIndex {
  const entries = [...cities]
    .sort((a, b) => b.population - a.population)
    .map((city) => {
      const full = normalizeQuery(city.name);
      return { city, full, words: full.split(" ") };
    });
  return { entries };
}

// Совпадение с началом названия — выше, с началом любого слова — ниже; внутри группы — крупные города первыми
export function searchCities(index: CityIndex, query: string, limit = 8): City[] {
  const needle = normalizeQuery(query);
  if (needle.length < MIN_QUERY_LENGTH || needle.length > MAX_QUERY_LENGTH) return [];
  const starts: City[] = [];
  const wordStarts: City[] = [];
  for (const { city, full, words } of index.entries) {
    if (full.startsWith(needle)) starts.push(city);
    else if (words.some((word) => word.startsWith(needle)) || full.includes(` ${needle}`)) wordStarts.push(city);
  }
  return [...starts, ...wordStarts].slice(0, limit);
}
```

(Порядок в тесте `новгород`: «Нижний Новгород» крупнее «Великого Новгорода» — обе записи попадают во вторую группу и идут по населению; «моск» — «Москва» в первой группе.)

`packages/geo/src/index.ts`: `export * from "./types"; export * from "./normalize"; export * from "./search"; import cities from "../data/cities.json"; import type { City } from "./types"; export const CITIES = cities as readonly City[];`

Run: `pnpm test packages/geo`
Expected: после реализации PASS.

- [ ] **Step 4: Сборка базы из дампа GeoNames**

`packages/geo/scripts/build-cities.mjs` читает `cities5000.txt`, `alternateNamesV2.txt` (только записи с языком `ru` и признаком `isPreferredName`, иначе первая русская), `admin1CodesASCII.txt` и пишет `packages/geo/data/cities.json` в порядке убывания населения (поля `City`; название страны — `new Intl.DisplayNames(["ru"], { type: "region" }).of(countryCode)`). Запуск: `node packages/geo/scripts/build-cities.mjs C:\dev\geonames`. Скрипт печатает число городов, число без русского названия и число с пустым часовым поясом (должно быть 0 — такие строки отбрасывать с предупреждением).
Проверка результата тестом `packages/geo/src/data.test.ts`: в базе есть Москва, Новосибирск, Мурманск, Анадырь, Владивосток, Калининград, Екатеринбург; у каждого города зона проходит `isValidZone` из `@oracle/core/natal`; нет дубликатов `id`; файл меньше 8 МБ.
Добавить `packages/geo/README.md`: источник, лицензия CC BY 4.0, дата загрузки, команда сборки.

- [ ] **Step 5: Маршрут `/api/cities`**

Перед написанием прочитать `apps/web/src/server/http.ts` и `rate-limit.ts` и повторить их способ ограничения частоты и формат ошибок. Тесты `route.test.ts`: `GET ?q=моск` → 200 и `cities[0].name === "Москва"`; `?q=м` и пустой → 400; `?q=` длиннее 40 символов → 400; ответ содержит заголовок `Cache-Control: public, max-age=86400`; 31-й запрос за минуту с одного адреса → 429; в журнал приложения текст запроса не пишется (в тесте подменить логгер и проверить, что он не вызван с `q`). Отдельно сообщить владелице: журнал обратного прокси (`deploy/`, раздел «Не трогать» в `AGENTS.md`) пишет адрес вместе с запросом — решить, исключать ли `/api/cities` из журнала или хранить его недолго; название города без даты — не персональные данные, но вместе с IP это лучше не копить.

- [ ] **Step 6: Commit**

```bash
git add packages/geo apps/web/src/app/api/cities apps/web/next.config.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(geo): city database from GeoNames, search and the /api/cities endpoint"
```

---

### Task 6: Тексты — манифест, проверка, первая партия

**Files:**
- Create: `packages/content/src/natal-manifest.ts`, `natal-manifest.test.ts`, `natal.ts`, `natal.test.ts`, `natal-check.ts`, `natal-check.test.ts`, `natal-texts.ts`, `packages/content/natal/*.md`
- Modify: `packages/content/scripts/build-arcana.mjs` (разбор `natal/`), `packages/content/package.json` (подпуть `./natal`), `packages/content/src/check.ts` — только использование `findStopPhrases`, не менять

**Interfaces:**
- Produces: `type NatalPageKind = "planet" | "ascendant"`, `type NatalPageRef = { slug: string; kind: NatalPageKind; body: BodyId | "ascendant"; sign: SignId; batch: number }`, `NATAL_PAGES: readonly NatalPageRef[]` (132: 10×12 + 12), `ACCEPTED_BATCHES: ReadonlySet<number>` (пока пуст — страницы закрыты, пока владелица не примет партию), `natalPageSlug(body, sign): string`, `natalPageBySlug(slug): NatalPageRef | undefined`, `NATAL_TEXTS`/`natalText(slug)`, `SIGN_NAMES: Record<SignId, { nominative; prepositional; slugPart }>`, `BODY_NAMES`, `HOUSE_TEXTS` (12 коротких), `ASPECT_TEXTS` (5 коротких).

- [ ] **Step 1: Манифест и слаги**

Слаги — транслит названия: `solntse-v-ovne`, `luna-v-telce`, `merkuriy-v-bliznetsah`, `venera-v-rake`, `mars-vo-lve`, `yupiter-v-deve`, `saturn-v-vesah`, `uran-v-skorpione`, `neptun-v-streltse`, `pluton-v-kozeroge`, `ascendent-v-vodolee` (и т. д.; «во» перед «льве»). Партии: 1 — Солнце, Луна, асцендент (36); 2 — Меркурий, Венера, Марс (36); 3 — Юпитер, Сатурн (24); 4 — Уран, Нептун, Плутон (36). Тест `natal-manifest.test.ts`: 132 уникальных слага, у каждого знака 11 тел (10 + асцендент), `natalPageBySlug` работает в обе стороны, слаги — только `[a-z-]`.

- [ ] **Step 2: Формат файла текста**

`packages/content/natal/NNN-solntse-v-ovne.md`, как у Таро (шапка и разделы):

```markdown
---
order: 1
name: Солнце в Овне
slug: solntse-v-ovne
body: sun
sign: aries
batch: 1
keywords: инициатива; прямота; первый шаг
---

## Суть
…3–4 абзаца…

## Как это может проявляться
…3 абзаца, бытовые примеры…

## Подводные камни
…2 абзаца: где качество превращается в крайность (мягко, без запугивания)…

## Вопросы для размышления
- … (3–5 вопросов списком)

## Границы трактовки
…1 абзац: позиция — одна из многих, не приговор, не прогноз…
```

Объём: планета в знаке — не менее 330 слов, асцендент — не менее 250, дом и аспект — 40–90 слов в `HOUSE_TEXTS`/`ASPECT_TEXTS` внутри `natal-texts.ts` (двенадцать и пять записей, обычные строки).

- [ ] **Step 3: Проверка текстов (тесты вперёд)**

`natal-check.test.ts` проверяет `checkNatalTexts(pages)`: возвращает сообщения об ошибках для (а) пропущенного раздела, (б) меньше слов, чем нужно, (в) стоп-фраз (`findStopPhrases`), (г) двух страниц, у которых более 25 % пятисловных последовательностей совпадают (шаблонность — главный риск для индексации), (д) слова «будет», «произойдёт», «судьба предопределена» в прогностическом контексте — использовать существующий список стоп-фраз, не дублировать. Функция сходства:

```ts
// Доля пятисловных «шинглов» первой страницы, которые есть во второй
export function shingleOverlap(a: string, b: string, size = 5): number {
  const words = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const shingles = (list: string[]) => new Set(list.slice(0, Math.max(0, list.length - size + 1)).map((_, i) => list.slice(i, i + size).join(" ")));
  const first = shingles(words(a));
  const second = shingles(words(b));
  if (first.size === 0) return 0;
  let shared = 0;
  for (const item of first) if (second.has(item)) shared++;
  return shared / first.size;
}
```

Тест: два одинаковых текста → 1; два разных → меньше 0,05; текст, у которого заменены 2 слова из 100, → больше 0,8.

- [ ] **Step 4: Сборка и точка входа**

`build-arcana.mjs` собирает `natal/*.md` в `src/generated/natal.json` (как `tarot`); `packages/content/package.json` получает `"./natal": "./src/natal-texts.ts"`. `natal.ts` разбирает шапку и разделы (как `tarot.ts`). Run: `pnpm content:build && pnpm test packages/content`.

- [ ] **Step 5: Первая партия текстов (черновики Claude)**

Написать 36 текстов партии 1 + 12 домов + 5 аспектов; правила достоверности — как для арканов и Таро (`docs/oracle-article-writer.md`, раздел «Правила достоверности»): никаких предсказаний, сроков, диагнозов; формулировки-гипотезы; каждая страница про свой знак, без повторяющихся «шаблонных» абзацев (проверка `shingleOverlap`). **Партия идёт на вычитку владелице отдельным PR; в `ACCEPTED_BATCHES` номер попадает только после её принятия.** Следующие партии — по тому же циклу и каждая отдельным PR.

- [ ] **Step 6: Commit**

```bash
git add packages/content
git commit -m "content(natal): manifest, text checks and the first batch of drafts"
```

---

### Task 7: Калькулятор `/natalnaya-karta`

**Files:**
- Create: `apps/web/src/lib/natal-input.ts` (+ test), `apps/web/src/lib/natal-wheel.ts` (+ test), `apps/web/src/lib/natal-paths.ts`, `apps/web/src/components/natal/NatalForm.tsx`, `CityField.tsx`, `NatalResult.tsx`, `NatalWheel.tsx`, `NatalTable.tsx`, `NatalAspects.tsx`, `apps/web/src/app/natalnaya-karta/page.tsx`, шрифт глифов в `apps/web/public/fonts/` (+ подключение через `next/font/local`)
- Modify: `apps/web/src/app/globals.css` (стили, только переменные цветов)

**Interfaces:**
- Consumes: `computeNatalChart`, `localToUtc`, `type NatalChart` из `@oracle/core/natal` (импорт динамический, после нажатия «Рассчитать карту»); `City`, поиск через `/api/cities`.
- Produces: `validateNatalInput(raw, today): { ok: true; value: NatalInput } | { ok: false; field: "date" | "time" | "city"; message: string }`, где `NatalInput = { date: string; time: string | null; city: City }`; `buildBirthMoment(input, zoneChoice?): { moment: BirthMoment; clock: LocalToUtc["kind"] }`; `wheelPoints(chart): { id; angle; labelAngle }[]` (развод скученных планет не ближе 8°; Овен слева, если времени нет; асцендент слева, если есть).

- [ ] **Step 1: Проверка ввода (тесты вперёд)**

Тесты `natal-input.test.ts`: пустая дата → «Укажите дату рождения»; дата 31.12.1899 и дата в будущем → сообщение о диапазоне; несуществующая дата `2023-02-30` → ошибка; время `25:00`, `12:60`, `7:5` → ошибка, `07:05` и `23:59` — верно; время `00:00` — корректное время, не «пусто»; флажок «неизвестно» → `time: null` и поле времени игнорируется; город обязателен; `buildBirthMoment` для Москвы 07.03.1990 12:00 даёт `instant === 1990-03-07T09:00Z` (результат не зависит от текущей даты), `clock === "ok"`; для 01.04.1981 00:30 — `clock === "gap"`; для 30.09.1990 02:30 без выбора — `clock === "ambiguous"`, а с `zoneChoice: "second"` берётся `alternative`; при `time === null` момент — местный полдень, `timeKnown === false`.

- [ ] **Step 2: Форма**

Поля и тексты дословно из «Global Constraints». Дата подставляется из сохранённой в браузере (`apps/web/src/lib/browser-date.ts`, тот же способ, что у калькулятора матрицы). Поле «Место рождения» — `CityField`: `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant`, список `role="listbox"`, пункты `role="option"` высотой ≥ 44 px с названием, регионом и страной; запрос уходит с задержкой 250 мс и не чаще одного в полёте; стрелки/Enter/Escape; `role="status"` сообщает «Найдено: N»; под полем подсказка «Нет вашего города? Выберите ближайший крупный: час пояса и долгота почти не изменятся». Ошибки — `role="alert"` у поля. Кнопка «Рассчитать карту» неактивна, пока нет города.

- [ ] **Step 3: Результат**

`NatalResult` — `<section aria-labelledby>` «Ваша натальная карта»: сводка «Солнце в Рыбах · Луна в Раке · Асцендент в Раке» (без времени: «Асцендент: нужно время рождения»), затем три ключевых текста (если партия принята — полный текст с ссылкой «Читать полностью», иначе краткая сводка без текстов — страницы-пустышки не открываем), колесо, таблица позиций (знак, градусы и минуты, «℞» для обратного движения с подписью «обратное движение», дом), аспекты (строка на аспект: «Солнце — Плутон: тригон, точность 1°11′» плюс однострочное описание типа из `ASPECT_TEXTS`), дисклеймер. Уведомления: `gap` — «В это время часы переводили вперёд: такого времени не было. Считаем по ближайшему существующему — 01:30»; `ambiguous` — два переключателя «Первый раз» / «Второй раз», пока не выбрано, карта не строится; `uncertainSigns` — «В этот день {тело} сменило знак — точный знак зависит от времени рождения»; широта выше 66,5° — «За полярным кругом асцендент сильно зависит от минуты рождения»; рождение до 1930 — «Для ранних лет история часовых поясов менее надёжна».

- [ ] **Step 4: Колесо**

`natal-wheel.ts` (чистая геометрия, тесты вперёд): `wheelPoints` раздвигает метки так, что соседние не ближе 8° (в том числе через 0/360), порядок сохраняется; при `timeKnown` асцендент слева (на «9 часов»), знаки идут против часовой стрелки от него — так принято в западной астрологии: МС оказывается сверху; без времени — Овен слева и без линий домов. `NatalWheel` — `<svg role="img" aria-label="Колесо натальной карты: …">` с краткой сводкой в `aria-label`, подробности — в таблице под ним; цвета только через переменные из `globals.css`; без анимации (или с `prefers-reduced-motion`). Глифы — шрифт-подмножество (OFL, например Noto Sans Symbols 2) через `next/font/local`; перед выбором проверить скриншотами на iOS и Android, что знаки рисуются текстом, а не цветными эмодзи (в разметке — вариативный селектор U+FE0E).

- [ ] **Step 4a: Размер**

Динамический импорт ядра: `const { computeNatalChart, localToUtc } = await import("@oracle/core/natal")` в обработчике. Run: `pnpm --filter @oracle/web build` и посмотреть размер чанка страницы: допустимо не более ≈ 200 КБ gzip для `/natalnaya-karta` (сама библиотека ≈ 47 КБ gzip); страницы матрицы и Таро не должны вырасти.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): natal chart calculator with city search, wheel, table and aspects"
```

---

### Task 8: Страницы значений и запуск практики

**Files:**
- Create: `apps/web/src/app/natalnaya-karta/[slug]/page.tsx`, `apps/web/src/components/natal/NatalPageView.tsx`
- Modify: `apps/web/src/lib/practices.ts` (`natal`: `href: NATAL_PATH`), `apps/web/src/lib/seo.ts` (`PUBLIC_PATHS` + путь калькулятора + страницы только принятых партий), `apps/web/src/app/page.tsx` и общие `description` (вернуть упоминание натальной карты, убранное аудитом 11.10), `AGENTS.md` (строки таблицы и дословные тексты), `apps/web/src/app/metodika/page.tsx` (раздел о расчёте и указание источника GeoNames), `packages/content/src/article-basis.ts` (ключ `natal` — только после принятия партии 1, отдельным коммитом)

**Interfaces:**
- Consumes: `NATAL_PAGES`, `ACCEPTED_BATCHES`, `natalText` (задача 6).
- Produces: `NATAL_PATH = "/natalnaya-karta"`, `natalPagePath(ref): string`; `generateStaticParams` — только страницы принятых партий; остальные адреса — настоящий 404.

- [ ] **Step 1: Тесты**

`seo.test.ts` (расширить): `PUBLIC_PATHS` содержит `/natalnaya-karta`; содержит ровно по одному пути на каждую страницу из принятых партий и ни одного из непринятых; у `/natalnaya-karta/solntse-v-ovne` при пустом `ACCEPTED_BATCHES` — 404 (e2e в задаче 10).

- [ ] **Step 2: Страница значения**

`<h1>` — «Солнце в Овне»; разделы из текста; блок «Рассчитайте свою карту» (кнопка-ссылка на калькулятор, цель `natal_to_calculator`); блок «Соседние знаки» (предыдущий и следующий знак той же планеты) и «Это же тело в других знаках» (12 ссылок), навигация между страницами для перелинковки; разметка `Article` и `BreadcrumbList` через `jsonLdScript`; `publicMetadata` с уникальным `title` вида «Солнце в Овне: значение в натальной карте» и `description` из первого абзаца раздела «Суть» (не длиннее 160 символов); canonical; изображение для превью — общее `SITE_PREVIEW_IMAGE`; дисклеймер.

- [ ] **Step 3: Открыть практику**

`practices.ts`: у `natal` `href: NATAL_PATH`, карточка перестаёт быть «Скоро» (метка «Открыто»; тексты кнопок и меток — дословно по `AGENTS.md`); `app/page.tsx` и общие описания снова упоминают натальную карту (аудит 11.10 убрал их до запуска); `/metodika` — абзац «Натальная карта»: библиотека `astronomy-engine`, дома по знакам, средний узел, база городов GeoNames (CC BY 4.0) со ссылкой, база часовых поясов IANA, точность и её пределы. Не заявлять неподтверждённых квалификаций.

- [ ] **Step 4: Commit**

```bash
git add apps/web AGENTS.md
git commit -m "feat(web): natal chart reference pages and open the practice"
```

---

### Task 9: Сохранение времени и места в портрет (после гейта G3)

**Не начинать до решения владелицы по G3.** Это единственная задача плана, которая меняет базу данных и описание обработки данных.

**Files:**
- Modify: `packages/db/src/schema.ts` (таблица `birth_profiles`), `packages/db/src/profiles.ts`, `packages/db/drizzle/*` (миграция), `packages/db/src/delete-user.ts` (проверить, что новые поля удаляются)
- Create: `apps/web/src/app/api/profile/birth-place/route.ts` (+ test), `apps/web/src/components/natal/SaveToPortrait.tsx`
- Modify: `apps/web/src/app/portret/page.tsx` (показать сохранённое и ссылку «Открыть карту»), юридические страницы — только по решению владелицы (в `AGENTS.md` они в разделе «Не трогать»)

**Interfaces:**
- Produces: колонки `birth_time` (`time`, nullable), `birth_place_name` (`text`), `birth_latitude`, `birth_longitude` (`double precision`), `birth_zone` (`text`) — все nullable и заполняются вместе (проверка в БД `CHECK`: либо все пять заполнены, либо ни одной); `saveBirthPlace(db, userId, place, now)`, `getBirthPlace(db, userId)`; `POST /api/profile/birth-place` `{ time: "HH:MM" | null, name, latitude, longitude, zone }` → 200; неверные значения → 400; без входа → 401.

- [ ] **Step 1: Тесты БД и маршрута (вперёд):** сохранить и прочитать; частично заполненный набор отклоняется; `delete-user` удаляет все новые поля (проверка на существующем тесте удаления); маршрут отклоняет `zone`, не проходящую `isValidZone`, широту вне ±85, имя длиннее 120 символов, время `24:00`.
- [ ] **Step 2: Миграция и реализация;** кнопка «Сохранить в портрет» после результата: для гостя — «Войти и сохранить» (как у матрицы), после входа возвращает на калькулятор с сохранённой картой. Данные уходят на сервер только по нажатию.
- [ ] **Step 3: Прогнать** `pnpm test`, `pnpm test:e2e` (сценарий удаления данных должен остаться зелёным), проверить, что «Удалить мои данные» удаляет время и место.
- [ ] **Step 4: Commit** `feat(db,web): save birth time and place to the portrait`.

---

### Task 10: Метрика, сквозные тесты, документы

**Files:**
- Modify: `apps/web/src/lib/analytics.ts` (`GOALS`: `natal_calculated`, `natal_save_click`, `natal_share`, `natal_to_calculator`), `docs/analytics-goals.md`, `AGENTS.md`, `docs/superpowers/plans/00-roadmap.md` (строка этапа — выпущено)
- Create: `e2e/natal.spec.ts`; расширить `e2e/goals.spec.ts`

**Interfaces:**
- Consumes: всё из задач 7–9.

- [ ] **Step 1: Цели:** `natal_calculated` — после успешного расчёта; `natal_save_click` — нажатие «Сохранить в портрет» (или «Войти и сохранить»); `natal_share` — «Поделиться» (ссылка без даты, времени и города — на калькулятор); `natal_to_calculator` — переход со страницы значения. Тест в `goals.spec.ts` повторяет образец матрицы: события есть, у каждого `hasParams === false`. Описать в `docs/analytics-goals.md` (таблица и воронка «Натальная карта: `natal_to_calculator` → `natal_calculated` → `natal_save_click`»).
- [ ] **Step 2: Сквозные тесты** `e2e/natal.spec.ts` (мобильный Chrome, как остальные):
  - Москва, 07.03.1990, 12:00: ответ содержит «Солнце в Рыбах» и «Асцендент в Раке»; `<h1>` ровно один; `role="status"` после расчёта; нет горизонтальной прокрутки на 375 px;
  - «Время рождения неизвестно»: нет слов «Асцендент в» и колонки «Дом»; для 20.03.2024 есть предупреждение о смене знака Солнцем;
  - 01.04.1981, 00:30, Москва: сообщение «такого времени не было»; 30.09.1990, 02:30: появляются «Первый раз» / «Второй раз», до выбора карты нет;
  - Мурманск: результат построен, есть пояснение про полярный круг;
  - поиск города: ввод «ростов на дону» находит «Ростов-на-Дону», навигация стрелками и Enter, ошибка без города — `role="alert"`;
  - дата 31.12.1899 и дата в будущем — сообщение о диапазоне;
  - в запросах сети при расчёте нет ни даты, ни времени (проверка `page.on("request")`: единственные обращения к нашему серверу — `/api/cities?q=…` и статические файлы);
  - `/natalnaya-karta/solntse-v-ovne` — 404, пока партия не принята; после — 200, один `<h1>`, canonical, есть разметка `Article`.
- [ ] **Step 3: Документы:** `AGENTS.md` (таблица «Где что лежит»: калькулятор, страницы значений, тексты `packages/content/natal`, база городов; дословные тексты кнопок и полей из «Global Constraints»); `docs/analytics-goals.md`; в `00-roadmap.md` — строка выпущенного этапа; в `docs/oracle-article-writer.md` — ключ `natal` появляется в списке материалов только после принятия партий.
- [ ] **Step 4: Итоговые проверки:** `pnpm install && pnpm typecheck && pnpm test && pnpm test:e2e`; визуальная проверка на 375 px (главная, калькулятор, результат, страница значения); `pnpm --filter @oracle/web build` и размер чанка (задача 7, шаг 4a).
- [ ] **Step 5: Commit** `test(e2e): natal chart flows, goals and docs`.

---

## Порядок и оценка

| Задача | Размер | Зависит от | Можно выпустить отдельно |
|---|---|---|---|
| 1–4 ядро | малая (≈ 1 день работы агента; тесты быстрые) | — | нет (внутреннее) |
| 5 города | средняя (сборка базы требует ручного скачивания дампа) | G1 | нет |
| 6 тексты, партия 1 | **самая большая** — 53 текста ≈ 14 тыс. слов, затем вычитка владелицей | G1, G2 | нет |
| 7 калькулятор | средняя | 4, 5 | да, если карточка остаётся «Скоро» и ссылка не опубликована; лучше выпускать вместе с 8 |
| 8 страницы и запуск | средняя | 6 (принятая партия), 7 | **да — это публичный запуск** |
| 9 портрет | средняя | G3 | да, позже |
| 10 цели, e2e, документы | малая | 7–9 | вместе с 8 |

Партии текстов 2–4 (ещё 96 текстов ≈ 32 тыс. слов) выходят отдельными PR после запуска, по одной партии за цикл вычитки; страницы появляются на сайте по мере принятия. Платный разбор (190–290 ₽) — план 7б после первых цифр по `natal_calculated` и спросу.

## Self-Review

1. **Покрытие спецификации.** Бесплатный результат (колесо, таблица, три ключевых текста, аспекты) — задачи 4, 6, 7; режим «время неизвестно» — 4, 7, 10; D1 (дома по знакам) — 3; D2 (средний узел) — 2; D3 (расчёт в браузере) — 7, 10 (проверка сети); D4 (города) — 5, указание источника — 8; D5 (часовые пояса, зазоры) — 1, 7; D6 (тексты партиями) — 6; D7 (диапазон дат) — 7; D8 (сохранение — после гейта) — 9; D9 (спрос) — G2. Платный разбор — вне плана (спецификация, раздел 3).
2. **Заглушки.** Намеренно «снимаемые» данные: эталонные карты (шаг 5 задачи 4 — источник и порядок снятия описаны; файл с нулями не коммитить), дамп GeoNames (задача 5, шаг 1), сами тексты (задача 6, шаг 5 — формат, объём и проверки заданы). Остальное — полный код и тесты.
3. **Согласованность типов.** `BodyId`, `SignId`, `ChartPoint`, `NatalChart`, `LocalToUtc`, `BirthMoment`, `City`, `NatalPageRef` определены в задачах 1–6 и в поздних задачах используются под теми же именами; `computeNatalChart`/`localToUtc` импортируются только из `@oracle/core/natal`.
4. **Review Focus.** Строки 1–5 покрыты: (1) — тесты `localToUtc` (задача 1) и сценарии 01.04.1981/30.09.1990 (задача 10); (2) — `angles.test` (Мурманск) и `chart.test`, пояснение в задаче 7, сценарий в задаче 10; (3) — `chart.test` (Уэлен, Буэнос-Айрес); (4) — `chart.test` и сценарий неизвестного времени; (5) — `search.test` и `route.test`.
