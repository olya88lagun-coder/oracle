# План 3а — Лила: бесплатная игра и справочник клеток

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Открыть практику «Лила»: полноценная бесплатная партия (намерение, кубик, поле 72 клеток, змеи и стрелы, текст и вопрос клетки на каждом ходу, история; гость — в браузере, вошедший — в портрете), 72 справочные страницы клеток, карточка «Лила» открыта на главной и в портрете.

**Architecture:** Правила игры — чистые функции в `packages/core` (одна реализация для браузера гостя и сервера). Тексты 72 клеток — один файл `packages/content/lila-cells.md`, собирается в JSON отдельной точкой входа `@oracle/content/lila` (клиентский бандл не тянет арканы). Партии вошедших — таблицы `lila_games`/`lila_moves` в `packages/db`, бросок и проверку правил делает сервер (`apps/web/src/server/lila-service.ts`). Экран игры — клиентский компонент с двумя адаптерами (`гость` — `localStorage`, `аккаунт` — API), общий вид партии `GameView` строится одной функцией. Поле уже есть: компонент `Board` (`apps/web/src/components/lila/`).

**Tech Stack:** TypeScript, Next.js 16 (App Router), Drizzle + PGlite (тесты) / Postgres, Vitest, Playwright, zod.

**Spec:** `docs/superpowers/specs/2026-09-29-lila-design.md` (разделы 1–5, 7, 8 без платной части; платное — план 3б `2026-09-29-plan-3b-lila-paid.md`).

## Global Constraints

- Тексты интерфейса — русские, на «вы», без обещаний предсказать будущее; коммиты — conventional commits на английском (`feat(web): …`, `feat(core): …`).
- Кнопки и поля — дословно: «Играть», «Бросить кубик», «Играю со своим кубиком», «Сохранить партию», «Продолжить партию», «Завершить партию», «Играть без проводника», «Войти и сохранить партию», «Открыто клеток», «Попробовать снова». Ровно один `<h1>` на странице; статусы — `role="status"`, ошибки — `role="alert"`.
- Правила: шестёрка ставит на клетку 1 (без дополнительного броска); на 68 — только точным броском (или стрелой 54→68); из клеток 69–72 идём вперёд, через 72 не переходим, 72→51 — змея; `MAX_MOVES = 120`; завершить партию можно после 68 или с 10 ходов; намерение ≤ 300 знаков, запись ≤ 500.
- Змеи: 12→8, 16→4, 24→7, 29→6, 44→9, 52→35, 55→3, 61→13, 63→2, 72→51. Стрелы: 10→23, 17→69, 20→32, 22→60, 27→41, 28→50, 37→66, 45→67, 46→62, 54→68.
- Гость: партия целиком в `localStorage` (ключ `lila:game:v1`), записи на сервер не отправляются. Вошедший: бросок и правила — на сервере (`crypto.randomInt`), клиенту не верим.
- Внешние CDN, шрифты и скрипты не подключать; на 375 px нет горизонтальной прокрутки, текст ≥ 14 px (тексты клеток, вопросы — 16 px), зоны нажатия ≥ 44 px, контраст WCAG AA, `prefers-reduced-motion` для анимаций.
- Дисклеймер `DISCLAIMER` остаётся в подвале; Метрика подключается только после согласия — `Analytics.tsx` не менять.
- Не трогать: `apps/web/src/server/` не менять там, где не сказано в задаче; `apps/worker`, `deploy/`, `.github/`, `Dockerfile` — в этом плане не затрагиваются.
- Покрытие тестами `packages/*/src`, `apps/web/src/server`, `apps/web/src/lib`, `apps/worker/src` ≥ 80 %.
- Полное ревью (исполнитель + ревьюер) — задачи 1, 3, 4 (правила игры, данные и доступ, удаление данных, перенос гостевой партии); остальное — самопроверка.
- Все команды — из корня репозитория `C:\dev\oracle`. Ветка: `feat/lila-free` от свежего `master`.

## Структура файлов

| Файл | Ответственность |
|---|---|
| `packages/core/src/lila.ts` (+ test) | Константы, змеи и стрелы, `applyLilaRoll`, посещения, `replayLila`, `canRollLila`, `canFinishLila` |
| `packages/content/src/lila.ts`, `lila-check.ts`, `lila-cells.ts` (+ tests), `lila-cells.md`, `scripts/build-arcana.mjs` | Разбор и проверка текстов клеток, точка входа `@oracle/content/lila` |
| `packages/db/src/schema.ts`, `lila.ts` (+ test), `delete-user.ts` | Таблицы, операции с партиями, удаление данных |
| `apps/web/src/lib/lila-view.ts`, `lila-turn.ts`, `lila-guest.ts`, `lila-paths.ts`, `lila-themes.ts`, `lila-api.ts` (+ tests) | Общий вид партии, описание хода, гостевое хранилище, адреса, темы, клиенты API |
| `apps/web/src/server/lila-service.ts`, `lila-route.ts`, `lila-images.ts` (+ tests) | Сервис партий, общий обработчик маршрутов, список картинок клеток |
| `apps/web/src/app/api/lila/**` | Маршруты партий и переноса |
| `apps/web/src/components/lila/*` | `GameShell`, `IntentionForm`, `GamePlay`, `TurnPanel`, `DiceControls`, `MoveHistory`, `CellArt`, `CellFallback` |
| `apps/web/src/app/lila/**`, `apps/web/src/app/portret/lila/[id]/page.tsx` | Страницы: вход и справочник, игра, клетка, история партии |
| `e2e/lila.spec.ts` | Сквозные проверки |

---

### Task 1: Движок игры в `packages/core` (полное ревью)

**Files:**
- Create: `packages/core/src/lila.ts`
- Create: `packages/core/src/lila.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces (используют все следующие задачи):
  - `LILA_CELL_COUNT = 72`, `LILA_GOAL_CELL = 68`, `LILA_ENTRY_ROLL = 6`, `LILA_MAX_MOVES = 120`, `LILA_MIN_MOVES_TO_FINISH = 10`, `LILA_INTENTION_MAX_CHARS = 300`, `LILA_NOTE_MAX_CHARS = 500`
  - `LILA_SNAKES`, `LILA_ARROWS: Readonly<Record<number, number>>`
  - `type LilaTransition = "none" | "snake" | "arrow"`
  - `type LilaRollResult = { roll; from; landed; to; transition; entered; reachedGoal; wasted }`
  - `isLilaRoll(value: unknown): value is number`
  - `applyLilaRoll(position: number, roll: number): LilaRollResult` — бросает `RangeError` для позиции 68, чужой позиции и броска вне 1–6
  - `lilaVisitCounts(moves: readonly LilaMoveCells[]): Map<number, number>`, `lilaQuestionIndex(visits: number): 0 | 1 | 2`
  - `replayLila(rolls: readonly number[]): { position: number; results: LilaRollResult[] }` — бросает `RangeError`, если бросок невозможен (в том числе после цели)
  - `canRollLila(s: { position: number; movesCount: number }): boolean`, `canFinishLila(s): boolean`

- [ ] **Step 1: Написать тесты**

`packages/core/src/lila.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  applyLilaRoll,
  canFinishLila,
  canRollLila,
  isLilaRoll,
  LILA_ARROWS,
  LILA_SNAKES,
  lilaQuestionIndex,
  lilaVisitCounts,
  replayLila,
} from "./lila";

describe("snakes and arrows tables", () => {
  test("match the approved Harish Johari scheme", () => {
    expect(LILA_SNAKES).toEqual({ 12: 8, 16: 4, 24: 7, 29: 6, 44: 9, 52: 35, 55: 3, 61: 13, 63: 2, 72: 51 });
    expect(LILA_ARROWS).toEqual({ 10: 23, 17: 69, 20: 32, 22: 60, 27: 41, 28: 50, 37: 66, 45: 67, 46: 62, 54: 68 });
  });

  test("snakes go down and arrows go up", () => {
    for (const [from, to] of Object.entries(LILA_SNAKES)) expect(to).toBeLessThan(Number(from));
    for (const [from, to] of Object.entries(LILA_ARROWS)) expect(to).toBeGreaterThan(Number(from));
  });
});

describe("applyLilaRoll", () => {
  test("only a six lets the game begin, and it lands on cell 1", () => {
    expect(applyLilaRoll(0, 6)).toMatchObject({ landed: 1, to: 1, entered: true, wasted: false });
    for (const roll of [1, 2, 3, 4, 5]) expect(applyLilaRoll(0, roll)).toMatchObject({ landed: 0, to: 0, entered: false, wasted: true });
  });

  test("an ordinary move lands on the target cell", () => {
    expect(applyLilaRoll(1, 4)).toEqual({ roll: 4, from: 1, landed: 5, to: 5, transition: "none", entered: false, reachedGoal: false, wasted: false });
  });

  test("a snake takes the player down and reports both cells", () => {
    expect(applyLilaRoll(6, 6)).toMatchObject({ landed: 12, to: 8, transition: "snake" });
  });

  test("an arrow takes the player up", () => {
    expect(applyLilaRoll(4, 6)).toMatchObject({ landed: 10, to: 23, transition: "arrow" });
    expect(applyLilaRoll(11, 6)).toMatchObject({ landed: 17, to: 69, transition: "arrow" });
  });

  test("the goal needs an exact roll; an overshoot changes nothing", () => {
    expect(applyLilaRoll(67, 1)).toMatchObject({ landed: 68, to: 68, reachedGoal: true });
    expect(applyLilaRoll(66, 3)).toMatchObject({ landed: 66, to: 66, wasted: true, reachedGoal: false });
  });

  test("the arrow 54 to 68 also reaches the goal", () => {
    expect(applyLilaRoll(50, 4)).toMatchObject({ landed: 54, to: 68, transition: "arrow", reachedGoal: true });
  });

  test("from the cells above the goal the player moves on, and 72 is a snake to 51", () => {
    expect(applyLilaRoll(69, 3)).toMatchObject({ landed: 72, to: 51, transition: "snake", reachedGoal: false });
    expect(applyLilaRoll(70, 3)).toMatchObject({ wasted: true, to: 70 });
    expect(applyLilaRoll(71, 1)).toMatchObject({ landed: 72, to: 51 });
  });

  test("rejects the goal cell as a start, positions outside the field and rolls outside 1-6", () => {
    expect(() => applyLilaRoll(68, 1)).toThrow(RangeError);
    expect(() => applyLilaRoll(-1, 1)).toThrow(RangeError);
    expect(() => applyLilaRoll(73, 1)).toThrow(RangeError);
    expect(() => applyLilaRoll(1.5, 1)).toThrow(RangeError);
    for (const roll of [0, 7, 2.5, Number.NaN]) expect(() => applyLilaRoll(1, roll)).toThrow(RangeError);
  });

  test("every position and roll gives a result inside the field", () => {
    for (let position = 0; position <= 72; position += 1) {
      if (position === 68) continue;
      for (let roll = 1; roll <= 6; roll += 1) {
        const result = applyLilaRoll(position, roll);
        expect(result.from).toBe(position);
        expect(result.to).toBeGreaterThanOrEqual(0);
        expect(result.to).toBeLessThanOrEqual(72);
        if (result.wasted) expect(result.to).toBe(position);
        else expect(result.landed).not.toBe(position);
      }
    }
  });
});

describe("visits and questions", () => {
  test("count both the landing cell and the arrival cell, but not wasted moves", () => {
    const moves = [
      { landed: 1, to: 1, wasted: false },
      { landed: 12, to: 8, wasted: false },
      { landed: 8, to: 8, wasted: true },
    ];
    // Пустой ход (landed = to = позиция, wasted) посещением не считается
    expect(lilaVisitCounts(moves)).toEqual(new Map([[1, 1], [12, 1], [8, 1]]));
  });

  test("the question changes on the second and third visit and then stays", () => {
    expect([1, 2, 3, 4, 9].map(lilaQuestionIndex)).toEqual([0, 1, 2, 2, 2]);
    expect(lilaQuestionIndex(0)).toBe(0);
  });
});

describe("replayLila", () => {
  test("returns the final position and every result", () => {
    const { position, results } = replayLila([3, 6, 5, 6]);
    expect(results.map((r) => r.to)).toEqual([0, 1, 6, 8]);
    expect(position).toBe(8);
  });

  test("the shortest way to the goal uses three arrows: 1, 4 → 10 → 23, 28 → 50, 54 → 68", () => {
    const { position, results } = replayLila([6, 3, 6, 5, 4]);
    expect(results.map((r) => r.to)).toEqual([1, 4, 23, 50, 68]);
    expect(position).toBe(68);
    expect(results.at(-1)).toMatchObject({ landed: 54, transition: "arrow", reachedGoal: true });
  });

  test("rejects an invalid roll and any roll after the goal", () => {
    expect(() => replayLila([6, 9])).toThrow(RangeError);
    expect(() => replayLila([6, 3, 6, 5, 4, 1])).toThrow(RangeError);
  });
});

describe("game limits", () => {
  test("a roll is possible until the goal or the move limit", () => {
    expect(canRollLila({ position: 20, movesCount: 5 })).toBe(true);
    expect(canRollLila({ position: 68, movesCount: 5 })).toBe(false);
    expect(canRollLila({ position: 20, movesCount: 120 })).toBe(false);
  });

  test("finishing is possible at the goal or from ten moves", () => {
    expect(canFinishLila({ position: 68, movesCount: 3 })).toBe(true);
    expect(canFinishLila({ position: 20, movesCount: 9 })).toBe(false);
    expect(canFinishLila({ position: 20, movesCount: 10 })).toBe(true);
  });

  test("isLilaRoll accepts integers 1-6 only", () => {
    expect([1, 6].every(isLilaRoll)).toBe(true);
    expect([0, 7, 1.2, "3", null].some(isLilaRoll)).toBe(false);
  });
});
```

- [ ] **Step 2: Запустить тесты — должны упасть**

Run: `pnpm vitest run packages/core/src/lila.test.ts`
Expected: FAIL — `Cannot find module './lila'`.

- [ ] **Step 3: Реализовать**

`packages/core/src/lila.ts`:

```ts
export const LILA_CELL_COUNT = 72;
export const LILA_GOAL_CELL = 68;
export const LILA_ENTRY_ROLL = 6;
export const LILA_MAX_MOVES = 120;
export const LILA_MIN_MOVES_TO_FINISH = 10;
export const LILA_INTENTION_MAX_CHARS = 300;
export const LILA_NOTE_MAX_CHARS = 500;
const DICE_MAX = 6;
const VISITS_BEFORE_REPEAT_QUESTIONS = 3;

// Классическая схема Хариша Джохари (утверждена 2026-09-24): голова змеи → хвост, начало стрелы → конец
export const LILA_SNAKES: Readonly<Record<number, number>> = { 12: 8, 16: 4, 24: 7, 29: 6, 44: 9, 52: 35, 55: 3, 61: 13, 63: 2, 72: 51 };
export const LILA_ARROWS: Readonly<Record<number, number>> = { 10: 23, 17: 69, 20: 32, 22: 60, 27: 41, 28: 50, 37: 66, 45: 67, 46: 62, 54: 68 };

export type LilaTransition = "none" | "snake" | "arrow";
export type LilaRollResult = {
  roll: number;
  from: number;
  landed: number;
  to: number;
  transition: LilaTransition;
  entered: boolean;
  reachedGoal: boolean;
  wasted: boolean;
};
export type LilaMoveCells = Pick<LilaRollResult, "landed" | "to" | "wasted">;

export const isLilaRoll = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= DICE_MAX;

function jump(cell: number): { to: number; transition: LilaTransition } {
  const snake = LILA_SNAKES[cell];
  if (snake !== undefined) return { to: snake, transition: "snake" };
  const arrow = LILA_ARROWS[cell];
  if (arrow !== undefined) return { to: arrow, transition: "arrow" };
  return { to: cell, transition: "none" };
}

// Позиция 0 — «ещё не родились». Цель 68 — только точным броском; выше цели (69–72, туда ведёт стрела 17→69) идём вперёд до 72
export function applyLilaRoll(position: number, roll: number): LilaRollResult {
  if (!Number.isInteger(position) || position < 0 || position > LILA_CELL_COUNT || position === LILA_GOAL_CELL) throw new RangeError(`position ${position} is not playable`);
  if (!isLilaRoll(roll)) throw new RangeError(`roll ${String(roll)} is not 1-6`);

  const stay: LilaRollResult = { roll, from: position, landed: position, to: position, transition: "none", entered: false, reachedGoal: false, wasted: true };
  if (position === 0) return roll === LILA_ENTRY_ROLL ? { ...stay, landed: 1, to: 1, entered: true, wasted: false } : stay;

  const target = position + roll;
  const limit = position < LILA_GOAL_CELL ? LILA_GOAL_CELL : LILA_CELL_COUNT;
  if (target > limit) return stay;
  const { to, transition } = jump(target);
  return { roll, from: position, landed: target, to, transition, entered: false, reachedGoal: to === LILA_GOAL_CELL, wasted: false };
}

// Посещение — приход на клетку падения и на итоговую клетку (после змеи или стрелы); пустой ход ничего не открывает
export function lilaVisitCounts(moves: readonly LilaMoveCells[]): Map<number, number> {
  const visits = new Map<number, number>();
  const add = (cell: number) => visits.set(cell, (visits.get(cell) ?? 0) + 1);
  for (const move of moves) {
    if (move.wasted) continue;
    add(move.landed);
    if (move.to !== move.landed) add(move.to);
  }
  return visits;
}

// Первый визит — первый вопрос клетки, второй — второй, третий и дальше — третий
export const lilaQuestionIndex = (visits: number): 0 | 1 | 2 => (Math.min(Math.max(visits, 1), VISITS_BEFORE_REPEAT_QUESTIONS) - 1) as 0 | 1 | 2;

export function replayLila(rolls: readonly number[]): { position: number; results: LilaRollResult[] } {
  let position = 0;
  const results: LilaRollResult[] = [];
  for (const roll of rolls) {
    const result = applyLilaRoll(position, roll);
    results.push(result);
    position = result.to;
  }
  return { position, results };
}

type GameState = { position: number; movesCount: number };

export const canRollLila = (state: GameState): boolean => state.position !== LILA_GOAL_CELL && state.movesCount < LILA_MAX_MOVES;
export const canFinishLila = (state: GameState): boolean => state.position === LILA_GOAL_CELL || state.movesCount >= LILA_MIN_MOVES_TO_FINISH;
```

`packages/core/src/index.ts` — добавить строку `export * from "./lila";`.

- [ ] **Step 4: Запустить тесты**

Run: `pnpm vitest run packages/core/src/lila.test.ts && pnpm --filter @oracle/core typecheck`
Expected: PASS, типы чисты.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/lila.ts packages/core/src/lila.test.ts packages/core/src/index.ts
git commit -m "feat(core): Lila game engine with snakes and arrows"
```

---

### Task 2: Тексты клеток — формат, проверка, сборка, черновик 72 клеток

**Files:**
- Create: `packages/content/src/lila.ts`, `packages/content/src/lila.test.ts`
- Create: `packages/content/src/lila-check.ts`, `packages/content/src/lila-check.test.ts`
- Create: `packages/content/src/lila-cells.ts`, `packages/content/src/lila-cells.test.ts`
- Create: `packages/content/lila-cells.md` (72 клетки)
- Create: `packages/content/src/generated/lila.json` (генерируется)
- Modify: `packages/content/scripts/build-arcana.mjs`, `packages/content/scripts/build-arcana.d.mts`, `packages/content/package.json`

**Interfaces:**
- Produces:
  - `type LilaCell = { readonly number: number; readonly name: string; readonly slug: string; readonly about: string; readonly questions: readonly [string, string, string]; readonly transition: string | null }`
  - `parseLilaCells(source: string): LilaCell[]` (сортировка по номеру; `LilaFormatError` с указанием клетки)
  - `checkLilaCells(cells: readonly LilaCell[]): string[]` (список ошибок, пустой — всё хорошо)
  - `@oracle/content/lila`: `LILA_CELLS: readonly LilaCell[]`, `lilaCellByNumber(n): LilaCell`, `lilaCellBySlug(slug): LilaCell | undefined`
- Consumes: `LILA_SNAKES`, `LILA_ARROWS`, `LILA_CELL_COUNT` из `@oracle/core`; `findStopPhrases` из `./check`.

Формат файла `packages/content/lila-cells.md`:

```
## 12. Зависть
slug: zavist
О чём это: …
Вопрос 1: …?
Вопрос 2: …?
Вопрос 3: …?
Переход: …
```

`Переход` есть только у 20 клеток: голова змеи или начало стрелы (10, 12, 16, 17, 20, 22, 24, 27, 28, 29, 37, 44, 45, 46, 52, 54, 55, 61, 63, 72). Остальные клетки строки `Переход` не имеют. Имена клеток — как в `content/lila/cells-source.md` и `apps/web/src/components/lila/board-data.ts` (скобки с санскритом в имени не пишем).

- [ ] **Step 1: Тесты разбора**

`packages/content/src/lila.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { LilaFormatError, parseLilaCells } from "./lila";

const cell = (number: number, name: string, extra = "") => `## ${number}. ${name}
slug: kletka
О чём это: Описание клетки, которое звучит как гипотеза.
Вопрос 1: Что вы замечаете здесь?
Вопрос 2: Что изменилось с прошлого раза?
Вопрос 3: Что осталось прежним?
${extra}`;

describe("parseLilaCells", () => {
  test("reads the number, name, texts and the optional transition", () => {
    const [first, second] = parseLilaCells(`${cell(2, "Майя")}\n${cell(1, "Рождение", "Переход: Вы возвращаетесь к теме.")}`);
    expect(first).toMatchObject({ number: 1, name: "Рождение", slug: "kletka", transition: "Вы возвращаетесь к теме." });
    expect(first?.questions).toEqual(["Что вы замечаете здесь?", "Что изменилось с прошлого раза?", "Что осталось прежним?"]);
    expect(second).toMatchObject({ number: 2, name: "Майя", transition: null });
  });

  test("fails with the cell number on a missing field", () => {
    expect(() => parseLilaCells("## 3. Гнев\nslug: gnev\nО чём это: Текст.")).toThrow(LilaFormatError);
    expect(() => parseLilaCells("## 3. Гнев\nslug: gnev\nО чём это: Текст.")).toThrow(/3/);
  });

  test("fails on a duplicate field, an unknown line, a bad slug and text before the first cell", () => {
    expect(() => parseLilaCells(`${cell(4, "Жадность")}\nО чём это: ещё раз`)).toThrow(LilaFormatError);
    expect(() => parseLilaCells(`${cell(4, "Жадность")}\nЛишнее: строка`)).toThrow(LilaFormatError);
    expect(() => parseLilaCells(cell(4, "Жадность").replace("slug: kletka", "slug: Kletka 1"))).toThrow(LilaFormatError);
    expect(() => parseLilaCells(`вступление\n${cell(4, "Жадность")}`)).toThrow(LilaFormatError);
  });

  test("fails on a number outside 1-72 and on the same number twice", () => {
    expect(() => parseLilaCells(cell(73, "Лишняя"))).toThrow(LilaFormatError);
    expect(() => parseLilaCells(`${cell(5, "А")}\n${cell(5, "Б")}`)).toThrow(LilaFormatError);
  });
});
```

- [ ] **Step 2: Запустить — упадёт**

Run: `pnpm vitest run packages/content/src/lila.test.ts`
Expected: FAIL (`Cannot find module './lila'`).

- [ ] **Step 3: Реализовать разбор**

`packages/content/src/lila.ts`:

```ts
import { LILA_CELL_COUNT } from "@oracle/core";

export type LilaCell = {
  readonly number: number;
  readonly name: string;
  readonly slug: string;
  readonly about: string;
  readonly questions: readonly [string, string, string];
  readonly transition: string | null;
};

export class LilaFormatError extends Error {}

const SLUG = /^[a-z]+(-[a-z]+)*$/;
const HEADING = /^(\d+)\.\s+(.+)$/;
const FIELD = /^(slug|О чём это|Вопрос 1|Вопрос 2|Вопрос 3|Переход):\s*(.+)$/;
const REQUIRED = ["slug", "О чём это", "Вопрос 1", "Вопрос 2", "Вопрос 3"] as const;

function parseBlock(block: string): LilaCell {
  const [heading = "", ...lines] = block.split("\n");
  const match = HEADING.exec(heading.trim());
  if (!match) throw new LilaFormatError(`заголовок клетки должен быть «N. Название»: «${heading.trim()}»`);
  const number = Number(match[1]);
  const fail = (message: string): never => {
    throw new LilaFormatError(`клетка ${number}: ${message}`);
  };
  if (number < 1 || number > LILA_CELL_COUNT) fail(`номер должен быть от 1 до ${LILA_CELL_COUNT}`);

  const fields = new Map<string, string>();
  for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
    const field = FIELD.exec(line);
    if (!field) fail(`неизвестная строка «${line}»`);
    const [, key = "", value = ""] = field!;
    if (fields.has(key)) fail(`поле «${key}» повторяется`);
    fields.set(key, value.trim());
  }
  for (const key of REQUIRED) if (!fields.get(key)) fail(`нет поля «${key}»`);

  const slug = fields.get("slug")!;
  if (!SLUG.test(slug)) fail("slug — латиница в нижнем регистре через дефис");
  return {
    number,
    name: match[2]!.trim(),
    slug,
    about: fields.get("О чём это")!,
    questions: [fields.get("Вопрос 1")!, fields.get("Вопрос 2")!, fields.get("Вопрос 3")!],
    transition: fields.get("Переход") ?? null,
  };
}

export function parseLilaCells(source: string): LilaCell[] {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new LilaFormatError("текст до первой клетки");
  const cells = blocks.map(parseBlock);
  const seen = new Set<number>();
  for (const cell of cells) {
    if (seen.has(cell.number)) throw new LilaFormatError(`клетка ${cell.number} повторяется`);
    seen.add(cell.number);
  }
  return cells.sort((a, b) => a.number - b.number);
}
```

- [ ] **Step 4: Тесты проверки**

`packages/content/src/lila-check.test.ts`:

```ts
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import { describe, expect, test } from "vitest";
import type { LilaCell } from "./lila";
import { checkLilaCells } from "./lila-check";

const hasTransition = (n: number) => n in LILA_SNAKES || n in LILA_ARROWS;
// Число → строка из букв a–j: slug допускает только латиницу и дефис
const letters = (number: number) => Array.from(String(number), (digit) => String.fromCharCode(97 + Number(digit))).join("");
const goodCell = (number: number): LilaCell => ({
  number,
  name: `Клетка ${number}`,
  slug: `kletka-${letters(number)}`,
  about: "Описание клетки в тоне гипотез: это может говорить о теме, к которой стоит присмотреться и сегодня, и позже. ".repeat(2).trim(),
  questions: ["Что вы замечаете в этой теме сейчас?", "Что изменилось с прошлого визита сюда?", "Что остаётся прежним и почему?"],
  transition: hasTransition(number) ? "Вы возвращаетесь к теме, которая ждёт внимания." : null,
});
const all = () => Array.from({ length: 72 }, (_, index) => goodCell(index + 1));

describe("checkLilaCells", () => {
  test("accepts a complete set", () => {
    expect(checkLilaCells(all())).toEqual([]);
  });

  test("reports a wrong count and a repeated slug", () => {
    expect(checkLilaCells(all().slice(1))[0]).toMatch(/71/);
    const cells = all();
    cells[1] = { ...cells[1]!, slug: cells[0]!.slug };
    expect(checkLilaCells(cells).join("\n")).toMatch(/slug/);
  });

  test("requires a transition exactly on snake heads and arrow starts", () => {
    const cells = all();
    cells[11] = { ...cells[11]!, transition: null };
    cells[1] = { ...cells[1]!, transition: "Лишний переход у обычной клетки, которого быть не должно." };
    const errors = checkLilaCells(cells).join("\n");
    expect(errors).toMatch(/клетка 12.*переход/i);
    expect(errors).toMatch(/клетка 2:.*переход/i);
  });

  test("rejects stop phrases, questions without a question mark and texts out of length", () => {
    const cells = all();
    cells[4] = { ...cells[4]!, about: `${cells[4]!.about} Вас ждет успех.` };
    cells[5] = { ...cells[5]!, questions: ["Это утверждение?", "Что вы видите здесь сейчас?", "Не вопрос"] };
    cells[6] = { ...cells[6]!, about: "Коротко." };
    const errors = checkLilaCells(cells).join("\n");
    expect(errors).toMatch(/клетка 5.*запрещённые обороты/);
    expect(errors).toMatch(/клетка 6.*вопрос 3/);
    expect(errors).toMatch(/клетка 7.*О чём это/);
  });

  test("rejects identical questions in one cell", () => {
    const cells = all();
    cells[7] = { ...cells[7]!, questions: [cells[7]!.questions[0], cells[7]!.questions[0], cells[7]!.questions[2]] };
    expect(checkLilaCells(cells).join("\n")).toMatch(/клетка 8.*совпада/);
  });
});
```

- [ ] **Step 5: Реализовать проверку**

`packages/content/src/lila-check.ts`:

```ts
import { LILA_ARROWS, LILA_CELL_COUNT, LILA_SNAKES } from "@oracle/core";
import { findStopPhrases } from "./check";
import type { LilaCell } from "./lila";

const ABOUT_CHARS = { min: 120, max: 700 } as const;
const QUESTION_CHARS = { min: 20, max: 280 } as const;
const TRANSITION_CHARS = { min: 25, max: 220 } as const;

const hasTransition = (number: number) => number in LILA_SNAKES || number in LILA_ARROWS;
const inRange = (text: string, range: { min: number; max: number }) => text.length >= range.min && text.length <= range.max;

function checkCell(cell: LilaCell): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`клетка ${cell.number}: ${message}`);
  if (!inRange(cell.about, ABOUT_CHARS)) at(`«О чём это» — от ${ABOUT_CHARS.min} до ${ABOUT_CHARS.max} знаков, сейчас ${cell.about.length}`);
  cell.questions.forEach((question, index) => {
    if (!question.endsWith("?")) at(`вопрос ${index + 1} должен заканчиваться знаком «?»`);
    if (!inRange(question, QUESTION_CHARS)) at(`вопрос ${index + 1} — от ${QUESTION_CHARS.min} до ${QUESTION_CHARS.max} знаков`);
  });
  if (new Set(cell.questions).size !== cell.questions.length) at("вопросы совпадают");
  if (hasTransition(cell.number) && !cell.transition) at("нужна строка «Переход» (голова змеи или начало стрелы)");
  if (!hasTransition(cell.number) && cell.transition) at("строка «Переход» только у клеток со змеёй или стрелой");
  if (cell.transition && !inRange(cell.transition, TRANSITION_CHARS)) at(`переход — от ${TRANSITION_CHARS.min} до ${TRANSITION_CHARS.max} знаков`);
  const stops = findStopPhrases([cell.name, cell.about, ...cell.questions, cell.transition ?? ""].join("\n"));
  if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  return errors;
}

export function checkLilaCells(cells: readonly LilaCell[]): string[] {
  const errors: string[] = [];
  if (cells.length !== LILA_CELL_COUNT) errors.push(`клеток ${cells.length}, нужно ${LILA_CELL_COUNT}`);
  for (let number = 1; number <= LILA_CELL_COUNT; number += 1) {
    if (!cells.some((cell) => cell.number === number)) errors.push(`клетка ${number} отсутствует`);
  }
  const bySlug = new Map<string, number>();
  for (const cell of cells) {
    const previous = bySlug.get(cell.slug);
    if (previous !== undefined) errors.push(`клетки ${previous} и ${cell.number}: slug «${cell.slug}» повторяется`);
    bySlug.set(cell.slug, cell.number);
    errors.push(...checkCell(cell));
  }
  return errors;
}
```

- [ ] **Step 6: Точка входа `@oracle/content/lila` и тест**

`packages/content/src/lila-cells.ts`:

```ts
import raw from "./generated/lila.json";
import { parseLilaCells, type LilaCell } from "./lila";

export type { LilaCell } from "./lila";

// Собранные тексты: pnpm content:build → src/generated/lila.json. Отдельная точка входа, чтобы клиентский бандл не тянул арканы
export const LILA_CELLS: readonly LilaCell[] = parseLilaCells(raw.cells);

export function lilaCellByNumber(number: number): LilaCell {
  const cell = LILA_CELLS.find((item) => item.number === number);
  if (!cell) throw new Error(`Клетка ${number} не найдена — выполните pnpm content:build`);
  return cell;
}

export function lilaCellBySlug(slug: string): LilaCell | undefined {
  return LILA_CELLS.find((item) => item.slug === slug);
}
```

`packages/content/package.json` — `"exports": { ".": "./src/index.ts", "./lila": "./src/lila-cells.ts" }`.

`packages/content/src/lila-cells.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { checkLilaCells } from "./lila-check";
import { LILA_CELLS, lilaCellByNumber, lilaCellBySlug } from "./lila-cells";

describe("the shipped Lila texts", () => {
  test("pass every content check", () => {
    expect(checkLilaCells(LILA_CELLS)).toEqual([]);
  });

  test("are found by number and by slug", () => {
    expect(lilaCellByNumber(12).name).toBe("Зависть");
    expect(lilaCellBySlug(lilaCellByNumber(12).slug)?.number).toBe(12);
    expect(() => lilaCellByNumber(99)).toThrow();
  });
});
```

- [ ] **Step 7: Сборка**

`packages/content/scripts/build-arcana.mjs` — добавить (рядом с `collectPositions`):

```js
export function collectLila(file) {
  return { cells: readText(file) };
}
```

и в блоке `if (import.meta.main)` после positions:

```js
  write(join(root, "src", "generated", "lila.json"), collectLila(join(root, "lila-cells.md")));
```

`build-arcana.d.mts` — добавить объявление `export function collectLila(file: string): { cells: string };` в том же стиле, что для `collectPositions`.

- [ ] **Step 8: Написать черновик 72 клеток**

Создать `packages/content/lila-cells.md` по «Правилам текстов» ниже и собрать: `pnpm content:build`. Затем `pnpm vitest run packages/content` — проверка должна пройти.

**Правила текстов (для Claude, автор черновика).**
- Смысл клетки — из `content/lila/cells-source.md` («О чём это» и «О чём задуматься»); текст источника не копируется и не пересказывается близко к тексту: свои формулировки, своя структура предложений. Санскритские термины из скобок в имени — не выводить.
- «О чём это» — 2–3 предложения (300–500 знаков), язык гипотез («может», «часто», «стоит заметить»), «вы», нейтральный род (без окончаний, выдающих пол), без предсказаний, диагнозов, оценок «плохо/хорошо», запугивания, религиозных утверждений как фактов; мистические формулы источника («вибрации», «высшие сферы») заменять психологическими образами.
- Три вопроса — открытые, от первого лица «мне/я» или «вы», без пола: первый — знакомство с темой; второй — «вы снова здесь: что изменилось»; третий — глубже или с другой стороны (что повторяется, что вы бы попробовали иначе). Каждый оканчивается «?», 40–200 знаков.
- «Переход» (20 клеток): одна фраза 60–160 знаков о том, что делает змея (возвращение к теме, которая просит внимания) или стрела (переход в другое состояние); без слов «наказание», «падение».
- slug — латиница через дефис по названию (`rozhdenie`, `mayya`, `gnev`, `zhadnost`, …); для клетки 12 — `zavist`, для клетки 8 — `alchnost` (на них ссылаются сквозные тесты).
- Файл — единая структура из Step «Формат»; после правки — `pnpm content:build` и коммит `packages/content/src/generated/lila.json`.
- Вычитка владелицей — гейт перед PR (а не перед разработкой): черновик отдаётся одним файлом `packages/content/lila-cells.md`.

- [ ] **Step 9: Прогон и коммит**

Run: `pnpm content:build && pnpm vitest run packages/content && pnpm --filter @oracle/content typecheck`
Expected: PASS.

```bash
git add packages/content
git commit -m "feat(content): Lila cell texts format, checks and draft of 72 cells"
```

---

### Task 3: Таблицы и операции с партиями в `packages/db` (полное ревью)

**Files:**
- Modify: `packages/db/src/schema.ts`, `packages/db/src/index.ts`, `packages/db/src/delete-user.ts`
- Create: `packages/db/src/lila.ts`, `packages/db/src/lila.test.ts`
- Modify: `packages/db/src/delete-user.test.ts`
- Create: `packages/db/drizzle/0002_*.sql` (генерируется)

**Interfaces:**
- Consumes: `applyLilaRoll`, `canFinishLila`, `canRollLila`, `replayLila`, `LILA_*` из `@oracle/core`; `Database`, `isUuid`.
- Produces:
  - `type LilaMode = "free" | "guided"`, `type LilaGameStatus = "awaiting_payment" | "active" | "finished" | "abandoned"`
  - `type LilaMoveRecord = { n: number; roll: number; from: number; landed: number; to: number; transition: LilaTransition; customDie: boolean; note: string | null; createdAt: Date }`
  - `type LilaGameRecord = { id; userId; mode; status; intention: string; position: number; movesCount: number; purchaseId: string | null; createdAt: Date; finishedAt: Date | null }`
  - `type LilaGameWithMoves = LilaGameRecord & { moves: LilaMoveRecord[] }`
  - `createLilaGame(db, { userId, intention, mode?: LilaMode, status?: "active" | "awaiting_payment" }): Promise<{ ok: true; game: LilaGameRecord } | { ok: false; error: "active_exists" }>`
  - `getLilaGame(db, gameId): Promise<LilaGameWithMoves | null>`
  - `getActiveLilaGame(db, userId): Promise<LilaGameWithMoves | null>`
  - `listLilaGames(db, userId): Promise<LilaGameRecord[]>` — только `active` и `finished`, новые сверху
  - `addLilaMove(db, { gameId, userId, roll, customDie }): Promise<{ ok: true; game: LilaGameWithMoves } | { ok: false; error: "not_found" | "not_active" | "limit" | "at_goal" }>`
  - `saveLilaNote(db, { gameId, userId, n, note }): Promise<boolean>` (`note: string | null`; false — партии или хода нет, партия не активна)
  - `finishLilaGame(db, { gameId, userId, now }): Promise<{ ok: true; status: "finished" | "abandoned" } | { ok: false; error: "not_found" | "not_active" | "too_early" }>` — при выполнимом правиле → `finished`; иначе в `free` → `abandoned`, в `guided` → `too_early`
  - `importLilaGame(db, { userId, intention, moves: { roll: number; customDie: boolean; note: string | null }[], replaceActive: boolean }): Promise<{ ok: true; game: LilaGameWithMoves } | { ok: false; error: "active_exists" | "invalid" }>`

- [ ] **Step 1: Схема**

В `packages/db/src/schema.ts` (импорт `boolean`, `smallint`, `primaryKey` добавить к существующему импорту из `drizzle-orm/pg-core`, а также `sql` из `drizzle-orm`) добавить:

```ts
export const lilaModeEnum = pgEnum("lila_mode", ["free", "guided"]);
export const lilaStatusEnum = pgEnum("lila_status", ["awaiting_payment", "active", "finished", "abandoned"]);
export const lilaTransitionEnum = pgEnum("lila_transition", ["none", "snake", "arrow"]);

export type LilaMode = (typeof lilaModeEnum.enumValues)[number];
export type LilaGameStatus = (typeof lilaStatusEnum.enumValues)[number];

export const lilaGames = pgTable(
  "lila_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    mode: lilaModeEnum("mode").notNull().default("free"),
    status: lilaStatusEnum("status").notNull().default("active"),
    intention: text("intention").notNull(),
    position: smallint("position").notNull().default(0),
    movesCount: smallint("moves_count").notNull().default(0),
    purchaseId: uuid("purchase_id")
      .unique()
      .references(() => purchases.id),
    createdAt: createdAt(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    // Одна активная партия на человека
    uniqueIndex("lila_games_one_active_uq").on(t.userId).where(sql`${t.status} = 'active'`),
    index("lila_games_user_idx").on(t.userId, t.createdAt),
  ],
);

export const lilaMoves = pgTable(
  "lila_moves",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => lilaGames.id, { onDelete: "cascade" }),
    n: smallint("n").notNull(),
    roll: smallint("roll").notNull(),
    fromCell: smallint("from_cell").notNull(),
    landedCell: smallint("landed_cell").notNull(),
    toCell: smallint("to_cell").notNull(),
    transition: lilaTransitionEnum("transition").notNull(),
    customDie: boolean("custom_die").notNull().default(false),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.n] })],
);
```

`packages/db/src/index.ts` — добавить `export * from "./lila";` и реэкспорт типов `LilaMode`, `LilaGameStatus` из схемы (в `lila.ts`).

- [ ] **Step 2: Сгенерировать миграцию**

Run: `pnpm --filter @oracle/db db:generate`
Expected: создан `packages/db/drizzle/0002_<имя>.sql` с `CREATE TYPE lila_*`, `CREATE TABLE lila_games`, `lila_moves` и частичным уникальным индексом (`WHERE "lila_games"."status" = 'active'`). Открыть файл и убедиться, что индекс частичный; закоммитить вместе с `meta/`.

- [ ] **Step 3: Тесты операций**

`packages/db/src/lila.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { addLilaMove, createLilaGame, finishLilaGame, getActiveLilaGame, getLilaGame, importLilaGame, listLilaGames, saveLilaNote } from "./lila";
import { createTestDb, seedUser } from "./testing";
import type { Database } from "./types";

let db: Database;
let userId: string;
const now = new Date("2026-10-01T10:00:00Z");

beforeEach(async () => {
  db = await createTestDb();
  userId = (await seedUser(db, { externalId: "lila-1" })).userId;
});

const start = async (intention = "Что мне важно увидеть?") => {
  const created = await createLilaGame(db, { userId, intention });
  if (!created.ok) throw new Error("no game");
  return created.game;
};
const roll = (gameId: string, value: number, customDie = false) => addLilaMove(db, { gameId, userId, roll: value, customDie });

describe("createLilaGame", () => {
  test("creates an active free game at position 0", async () => {
    const game = await start();
    expect(game).toMatchObject({ mode: "free", status: "active", position: 0, movesCount: 0, purchaseId: null });
  });

  test("refuses a second active game, but allows one after the first is closed", async () => {
    const first = await start();
    expect(await createLilaGame(db, { userId, intention: "Другое" })).toEqual({ ok: false, error: "active_exists" });
    await finishLilaGame(db, { gameId: first.id, userId, now });
    expect((await createLilaGame(db, { userId, intention: "Другое" })).ok).toBe(true);
  });

  test("a game awaiting payment does not block an active one", async () => {
    await createLilaGame(db, { userId, intention: "Ждёт оплаты", mode: "guided", status: "awaiting_payment" });
    expect((await createLilaGame(db, { userId, intention: "Свободная" })).ok).toBe(true);
  });
});

describe("addLilaMove", () => {
  test("numbers moves from 1, moves the piece and stores the transition", async () => {
    const game = await start();
    await roll(game.id, 6);
    await roll(game.id, 5);
    const result = await roll(game.id, 6);
    if (!result.ok) throw new Error("move failed");
    expect(result.game.position).toBe(8);
    expect(result.game.movesCount).toBe(3);
    expect(result.game.moves.map((m) => [m.n, m.landed, m.to, m.transition])).toEqual([
      [1, 1, 1, "none"],
      [2, 6, 6, "none"],
      [3, 12, 8, "snake"],
    ]);
  });

  test("two moves in a row keep distinct numbers", async () => {
    const game = await start();
    await Promise.all([roll(game.id, 6), roll(game.id, 1)]);
    expect((await getLilaGame(db, game.id))!.moves.map((m) => m.n)).toEqual([1, 2]);
  });

  test("a stranger cannot move, a closed game cannot move, the move limit stops the game", async () => {
    const game = await start();
    const other = (await seedUser(db, { externalId: "lila-2" })).userId;
    expect(await addLilaMove(db, { gameId: game.id, userId: other, roll: 6, customDie: false })).toEqual({ ok: false, error: "not_found" });
    await finishLilaGame(db, { gameId: game.id, userId, now });
    expect(await roll(game.id, 6)).toEqual({ ok: false, error: "not_active" });
  });

  test("stops at the move limit", async () => {
    const game = await start();
    for (let i = 0; i < 120; i += 1) expect((await roll(game.id, 1)).ok).toBe(true);
    expect(await roll(game.id, 1)).toEqual({ ok: false, error: "limit" });
  });
});

describe("saveLilaNote", () => {
  test("saves, replaces and clears a note of the owner's active game only", async () => {
    const game = await start();
    await roll(game.id, 6);
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 1, note: "Заметила." })).toBe(true);
    expect((await getLilaGame(db, game.id))!.moves[0]!.note).toBe("Заметила.");
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 1, note: null })).toBe(true);
    expect((await getLilaGame(db, game.id))!.moves[0]!.note).toBeNull();
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 9, note: "нет хода" })).toBe(false);
    const other = (await seedUser(db, { externalId: "lila-3" })).userId;
    expect(await saveLilaNote(db, { gameId: game.id, userId: other, n: 1, note: "чужая" })).toBe(false);
  });
});

describe("finishLilaGame", () => {
  test("a free game closed before ten moves is abandoned and stays out of the history", async () => {
    const game = await start();
    await roll(game.id, 6);
    expect(await finishLilaGame(db, { gameId: game.id, userId, now })).toEqual({ ok: true, status: "abandoned" });
    expect(await listLilaGames(db, userId)).toEqual([]);
  });

  test("from ten moves the game is finished and listed", async () => {
    const game = await start();
    for (let i = 0; i < 10; i += 1) await roll(game.id, 1);
    expect(await finishLilaGame(db, { gameId: game.id, userId, now })).toEqual({ ok: true, status: "finished" });
    const list = await listLilaGames(db, userId);
    expect(list.map((g) => [g.id, g.status, g.finishedAt])).toEqual([[game.id, "finished", now]]);
  });

  test("a guided game cannot be finished too early", async () => {
    const created = await createLilaGame(db, { userId, intention: "С проводником", mode: "guided" });
    if (!created.ok) throw new Error("no game");
    expect(await finishLilaGame(db, { gameId: created.game.id, userId, now })).toEqual({ ok: false, error: "too_early" });
  });

  test("a closed game cannot be finished again", async () => {
    const game = await start();
    await finishLilaGame(db, { gameId: game.id, userId, now });
    expect(await finishLilaGame(db, { gameId: game.id, userId, now })).toEqual({ ok: false, error: "not_active" });
  });
});

describe("getActiveLilaGame", () => {
  test("returns the active game with its moves, or null", async () => {
    expect(await getActiveLilaGame(db, userId)).toBeNull();
    const game = await start();
    await roll(game.id, 6);
    expect((await getActiveLilaGame(db, userId))!.moves).toHaveLength(1);
  });
});

describe("importLilaGame", () => {
  const moves = [
    { roll: 6, customDie: false, note: null },
    { roll: 5, customDie: true, note: "Первая запись" },
    { roll: 6, customDie: false, note: null },
  ];

  test("replays the guest rolls on the server and keeps notes", async () => {
    const result = await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: false });
    if (!result.ok) throw new Error("import failed");
    expect(result.game).toMatchObject({ status: "active", mode: "free", position: 8, movesCount: 3 });
    expect(result.game.moves.map((m) => [m.n, m.customDie, m.note])).toEqual([[1, false, null], [2, true, "Первая запись"], [3, false, null]]);
  });

  test("refuses when an active game exists, replaces it on request", async () => {
    const existing = await start("В портрете");
    expect(await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: false })).toEqual({ ok: false, error: "active_exists" });
    const replaced = await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: true });
    expect(replaced.ok).toBe(true);
    expect((await getLilaGame(db, existing.id))!.status).toBe("abandoned");
  });

  test("rejects impossible rolls, too many moves and long notes without changing anything", async () => {
    for (const bad of [
      [{ roll: 9, customDie: false, note: null }],
      Array.from({ length: 121 }, () => ({ roll: 1, customDie: false, note: null })),
      [{ roll: 6, customDie: false, note: "я".repeat(501) }],
    ]) {
      expect(await importLilaGame(db, { userId, intention: "Плохая", moves: bad, replaceActive: true })).toEqual({ ok: false, error: "invalid" });
    }
    expect(await getActiveLilaGame(db, userId)).toBeNull();
  });
});
```

- [ ] **Step 4: Запустить — упадёт**

Run: `pnpm vitest run packages/db/src/lila.test.ts`
Expected: FAIL (`Cannot find module './lila'`).

- [ ] **Step 5: Реализовать**

`packages/db/src/lila.ts`:

```ts
import { applyLilaRoll, canFinishLila, canRollLila, LILA_MAX_MOVES, LILA_NOTE_MAX_CHARS, type LilaTransition } from "@oracle/core";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { lilaGames, lilaMoves, type LilaGameStatus, type LilaMode } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type { LilaGameStatus, LilaMode } from "./schema";

export type LilaMoveRecord = {
  n: number;
  roll: number;
  from: number;
  landed: number;
  to: number;
  transition: LilaTransition;
  customDie: boolean;
  note: string | null;
  createdAt: Date;
};
export type LilaGameRecord = {
  id: string;
  userId: string;
  mode: LilaMode;
  status: LilaGameStatus;
  intention: string;
  position: number;
  movesCount: number;
  purchaseId: string | null;
  createdAt: Date;
  finishedAt: Date | null;
};
export type LilaGameWithMoves = LilaGameRecord & { moves: LilaMoveRecord[] };
export type ImportedMove = { roll: number; customDie: boolean; note: string | null };

const toGame = (row: typeof lilaGames.$inferSelect): LilaGameRecord => row;
const toMove = (row: typeof lilaMoves.$inferSelect): LilaMoveRecord => ({
  n: row.n,
  roll: row.roll,
  from: row.fromCell,
  landed: row.landedCell,
  to: row.toCell,
  transition: row.transition,
  customDie: row.customDie,
  note: row.note,
  createdAt: row.createdAt,
});

async function withMoves(db: Database, game: LilaGameRecord): Promise<LilaGameWithMoves> {
  const rows = await db.select().from(lilaMoves).where(eq(lilaMoves.gameId, game.id)).orderBy(asc(lilaMoves.n));
  return { ...game, moves: rows.map(toMove) };
}

// Одна активная партия на человека держится частичным уникальным индексом: вторая вставка просто ничего не вернёт
export async function createLilaGame(
  db: Database,
  p: { userId: string; intention: string; mode?: LilaMode; status?: "active" | "awaiting_payment" },
): Promise<{ ok: true; game: LilaGameRecord } | { ok: false; error: "active_exists" }> {
  const [row] = await db
    .insert(lilaGames)
    .values({ userId: p.userId, intention: p.intention, mode: p.mode ?? "free", status: p.status ?? "active" })
    .onConflictDoNothing()
    .returning();
  return row ? { ok: true, game: toGame(row) } : { ok: false, error: "active_exists" };
}

export async function getLilaGame(db: Database, gameId: string): Promise<LilaGameWithMoves | null> {
  if (!isUuid(gameId)) return null;
  const [row] = await db.select().from(lilaGames).where(eq(lilaGames.id, gameId)).limit(1);
  return row ? withMoves(db, toGame(row)) : null;
}

export async function getActiveLilaGame(db: Database, userId: string): Promise<LilaGameWithMoves | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db.select().from(lilaGames).where(and(eq(lilaGames.userId, userId), eq(lilaGames.status, "active"))).limit(1);
  return row ? withMoves(db, toGame(row)) : null;
}

export async function listLilaGames(db: Database, userId: string): Promise<LilaGameRecord[]> {
  if (!isUuid(userId)) return [];
  const rows = await db
    .select()
    .from(lilaGames)
    .where(and(eq(lilaGames.userId, userId), inArray(lilaGames.status, ["active", "finished"])))
    .orderBy(desc(lilaGames.createdAt));
  return rows.map(toGame);
}

type MoveError = "not_found" | "not_active" | "limit" | "at_goal";

// Строка партии блокируется на время хода: два одновременных броска получают разные номера
export async function addLilaMove(
  db: Database,
  p: { gameId: string; userId: string; roll: number; customDie: boolean },
): Promise<{ ok: true; game: LilaGameWithMoves } | { ok: false; error: MoveError }> {
  if (!isUuid(p.gameId)) return { ok: false, error: "not_found" };
  const outcome = await db.transaction(async (tx): Promise<{ ok: true } | { ok: false; error: MoveError }> => {
    const [game] = await tx.select().from(lilaGames).where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId))).limit(1).for("update");
    if (!game) return { ok: false, error: "not_found" };
    if (game.status !== "active") return { ok: false, error: "not_active" };
    if (game.position === 68) return { ok: false, error: "at_goal" };
    if (!canRollLila({ position: game.position, movesCount: game.movesCount })) return { ok: false, error: "limit" };
    const result = applyLilaRoll(game.position, p.roll);
    const n = game.movesCount + 1;
    await tx.insert(lilaMoves).values({
      gameId: game.id,
      n,
      roll: result.roll,
      fromCell: result.from,
      landedCell: result.landed,
      toCell: result.to,
      transition: result.transition,
      customDie: p.customDie,
    });
    await tx.update(lilaGames).set({ position: result.to, movesCount: n }).where(eq(lilaGames.id, game.id));
    return { ok: true };
  });
  if (!outcome.ok) return outcome;
  return { ok: true, game: (await getLilaGame(db, p.gameId))! };
}

export async function saveLilaNote(db: Database, p: { gameId: string; userId: string; n: number; note: string | null }): Promise<boolean> {
  if (!isUuid(p.gameId) || (p.note !== null && p.note.length > LILA_NOTE_MAX_CHARS)) return false;
  return db.transaction(async (tx) => {
    const [game] = await tx.select({ id: lilaGames.id }).from(lilaGames).where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId), eq(lilaGames.status, "active"))).limit(1);
    if (!game) return false;
    const updated = await tx.update(lilaMoves).set({ note: p.note }).where(and(eq(lilaMoves.gameId, p.gameId), eq(lilaMoves.n, p.n))).returning({ n: lilaMoves.n });
    return updated.length > 0;
  });
}

export async function finishLilaGame(
  db: Database,
  p: { gameId: string; userId: string; now: Date },
): Promise<{ ok: true; status: "finished" | "abandoned" } | { ok: false; error: "not_found" | "not_active" | "too_early" }> {
  if (!isUuid(p.gameId)) return { ok: false, error: "not_found" };
  return db.transaction(async (tx) => {
    const [game] = await tx.select().from(lilaGames).where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId))).limit(1).for("update");
    if (!game) return { ok: false, error: "not_found" } as const;
    if (game.status !== "active") return { ok: false, error: "not_active" } as const;
    const finishable = canFinishLila({ position: game.position, movesCount: game.movesCount });
    // Бесплатную партию можно закрыть и раньше, но в историю она не попадёт; платную — только по правилам
    if (!finishable && game.mode === "guided") return { ok: false, error: "too_early" } as const;
    const status = finishable ? "finished" : "abandoned";
    await tx.update(lilaGames).set({ status, finishedAt: p.now }).where(eq(lilaGames.id, game.id));
    return { ok: true, status } as const;
  });
}

// Перенос гостевой партии: броски воспроизводятся на сервере теми же правилами — присланному положению не верим
export async function importLilaGame(
  db: Database,
  p: { userId: string; intention: string; moves: readonly ImportedMove[]; replaceActive: boolean },
): Promise<{ ok: true; game: LilaGameWithMoves } | { ok: false; error: "active_exists" | "invalid" }> {
  if (p.moves.length > LILA_MAX_MOVES || p.moves.some((move) => move.note !== null && move.note.length > LILA_NOTE_MAX_CHARS)) return { ok: false, error: "invalid" };
  let position = 0;
  const results = [];
  try {
    for (const move of p.moves) {
      const result = applyLilaRoll(position, move.roll);
      results.push(result);
      position = result.to;
    }
  } catch {
    return { ok: false, error: "invalid" };
  }

  const gameId = await db.transaction(async (tx) => {
    if (p.replaceActive) {
      await tx.update(lilaGames).set({ status: "abandoned", finishedAt: new Date() }).where(and(eq(lilaGames.userId, p.userId), eq(lilaGames.status, "active")));
    }
    const [row] = await tx
      .insert(lilaGames)
      .values({ userId: p.userId, intention: p.intention, mode: "free", status: "active", position, movesCount: results.length })
      .onConflictDoNothing()
      .returning({ id: lilaGames.id });
    if (!row) return null;
    if (results.length > 0) {
      await tx.insert(lilaMoves).values(
        results.map((result, index) => ({
          gameId: row.id,
          n: index + 1,
          roll: result.roll,
          fromCell: result.from,
          landedCell: result.landed,
          toCell: result.to,
          transition: result.transition,
          customDie: p.moves[index]!.customDie,
          note: p.moves[index]!.note,
        })),
      );
    }
    return row.id;
  });
  if (!gameId) return { ok: false, error: "active_exists" };
  return { ok: true, game: (await getLilaGame(db, gameId))! };
}
```

- [ ] **Step 6: Удаление данных**

`packages/db/src/delete-user.ts` — импортировать `lilaGames` и в транзакции, до обнуления покупок, добавить:

```ts
    // Партии Лилы (намерения и записи) удаляются вместе с ходами; ссылка партии на покупку исчезает вместе с ней
    await tx.delete(lilaGames).where(eq(lilaGames.userId, userId));
```

Тест в `delete-user.test.ts` (в существующий файл, по образцу теста про разборы): создать партию с ходом и записью, вызвать `deleteUserData`, проверить `getLilaGame(db, id)` → `null` и `listLilaGames` → `[]`.

- [ ] **Step 7: Запустить**

Run: `pnpm vitest run packages/db && pnpm --filter @oracle/db typecheck`
Expected: PASS.

- [ ] **Step 8: Полное ревью, коммит**

Запустить исполнителя-ревьюера на схему, миграцию, `lila.ts`, `delete-user.ts` (доступ только владельцу, гонки, лимиты, замена активной партии, удаление). После правок:

```bash
git add packages/db
git commit -m "feat(db): Lila games and moves with one active game per user"
```

---

### Task 4: Общий вид партии, сервис и маршруты API (полное ревью)

**Files:**
- Create: `apps/web/src/lib/lila-view.ts`, `apps/web/src/lib/lila-view.test.ts`
- Create: `apps/web/src/server/lila-service.ts`, `apps/web/src/server/lila-service.test.ts`
- Create: `apps/web/src/server/lila-route.ts`
- Create: `apps/web/src/app/api/lila/games/route.ts`
- Create: `apps/web/src/app/api/lila/games/active/route.ts`
- Create: `apps/web/src/app/api/lila/games/[id]/roll/route.ts`, `note/route.ts`, `finish/route.ts`
- Create: `apps/web/src/app/api/lila/import/route.ts`
- Modify: `apps/web/src/server/rate-limit.ts`

**Interfaces:**
- Consumes: всё из Task 1 и Task 3.
- Produces:
  - `lib/lila-view.ts`:
    - `type MoveView = { n; roll; from; landed; to; transition: LilaTransition; customDie: boolean; note: string | null; entered: boolean; reachedGoal: boolean; wasted: boolean }`
    - `type GameView = { id: string; mode: "free" | "guided"; status: LilaGameStatus; intention: string; position: number; movesCount: number; moves: MoveView[]; canRoll: boolean; canFinish: boolean }`
    - `type GameSource = { id; mode; status; intention; position; movesCount; moves: { n; roll; from; landed; to; transition; customDie; note }[] }`
    - `toMoveView(move)`, `toGameView(game: GameSource): GameView`
    - `normalizeIntention(value: unknown): string | null` (trim, схлопнуть пробелы, 3–300 знаков), `normalizeNote(value: unknown): string | null | "invalid"` (пусто → `null`, >500 → `"invalid"`)
  - `server/lila-service.ts`: `type LilaDeps = { db: Database; randomRoll: () => number; now: () => Date }`, `type LilaError = "invalid" | "not_found" | "not_active" | "limit" | "at_goal" | "too_early" | "active_exists"`, `type LilaResult = { ok: true; game: GameView } | { ok: false; error: LilaError }`, функции `startGame`, `rollGame`, `saveNote`, `finishGame`, `importGame`, `activeGame`, `gameById` (все принимают `deps` и объект с `userId`), `defaultRandomRoll`.
  - API: тела и ответы JSON `{ ok: true, game }` / `{ ok: false, error }`; статусы: `invalid` 400, `not_found` 404, `not_active` 409, `limit` 409, `at_goal` 409, `too_early` 409, `active_exists` 409, `rate_limited` 429, `unauthorized` 401, `bad_origin` 403.

- [ ] **Step 1: Тесты вида партии**

`apps/web/src/lib/lila-view.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { normalizeIntention, normalizeNote, toGameView, toMoveView } from "./lila-view";

const move = (n: number, from: number, landed: number, to: number, roll: number, transition: "none" | "snake" | "arrow" = "none") => ({ n, roll, from, landed, to, transition, customDie: false, note: null });

describe("toMoveView", () => {
  test("marks the entry, a wasted move and the goal", () => {
    expect(toMoveView(move(1, 0, 1, 1, 6))).toMatchObject({ entered: true, wasted: false, reachedGoal: false });
    expect(toMoveView(move(1, 0, 0, 0, 3))).toMatchObject({ entered: false, wasted: true });
    expect(toMoveView(move(9, 67, 68, 68, 1))).toMatchObject({ reachedGoal: true, wasted: false });
  });
});

describe("toGameView", () => {
  const game = { id: "g", mode: "free" as const, status: "active" as const, intention: "Что мне важно?", position: 8, movesCount: 3, moves: [move(1, 0, 1, 1, 6), move(2, 1, 6, 6, 5), move(3, 6, 12, 8, 6, "snake")] };

  test("keeps the moves and computes what the player may do", () => {
    const view = toGameView(game);
    expect(view.moves).toHaveLength(3);
    expect(view).toMatchObject({ canRoll: true, canFinish: false });
  });

  test("a finished game can neither roll nor finish again", () => {
    expect(toGameView({ ...game, status: "finished" })).toMatchObject({ canRoll: false, canFinish: false });
  });

  test("the goal allows finishing and forbids rolling", () => {
    expect(toGameView({ ...game, position: 68 })).toMatchObject({ canRoll: false, canFinish: true });
  });
});

describe("normalizeIntention", () => {
  test("trims and collapses whitespace", () => {
    expect(normalizeIntention("  Что   мне\nважно? ")).toBe("Что мне важно?");
  });
  test("rejects non-strings, too short and too long texts", () => {
    expect(normalizeIntention(5)).toBeNull();
    expect(normalizeIntention("да")).toBeNull();
    expect(normalizeIntention("а".repeat(301))).toBeNull();
    expect(normalizeIntention("а".repeat(300))).not.toBeNull();
  });
});

describe("normalizeNote", () => {
  test("empty means no note, a long note is invalid", () => {
    expect(normalizeNote("   ")).toBeNull();
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote("я".repeat(501))).toBe("invalid");
    expect(normalizeNote(" Заметила. ")).toBe("Заметила.");
    expect(normalizeNote(7)).toBe("invalid");
  });
});
```

- [ ] **Step 2: Реализовать вид партии**

`apps/web/src/lib/lila-view.ts`:

```ts
import { canFinishLila, canRollLila, LILA_GOAL_CELL, LILA_INTENTION_MAX_CHARS, LILA_NOTE_MAX_CHARS, type LilaTransition } from "@oracle/core";

const INTENTION_MIN_CHARS = 3;

export type GameStatus = "awaiting_payment" | "active" | "finished" | "abandoned";
type MoveSource = { n: number; roll: number; from: number; landed: number; to: number; transition: LilaTransition; customDie: boolean; note: string | null };
export type GameSource = { id: string; mode: "free" | "guided"; status: GameStatus; intention: string; position: number; movesCount: number; moves: readonly MoveSource[] };

export type MoveView = MoveSource & { entered: boolean; reachedGoal: boolean; wasted: boolean };
export type GameView = {
  id: string;
  mode: "free" | "guided";
  status: GameStatus;
  intention: string;
  position: number;
  movesCount: number;
  moves: MoveView[];
  canRoll: boolean;
  canFinish: boolean;
};

// Настоящий ход всегда меняет клетку, поэтому «встали там же» — это пустой ход
export const toMoveView = (move: MoveSource): MoveView => ({
  n: move.n,
  roll: move.roll,
  from: move.from,
  landed: move.landed,
  to: move.to,
  transition: move.transition,
  customDie: move.customDie,
  note: move.note,
  entered: move.from === 0 && move.landed === 1,
  reachedGoal: move.to === LILA_GOAL_CELL && move.landed !== move.from,
  wasted: move.landed === move.from,
});

export function toGameView(game: GameSource): GameView {
  const active = game.status === "active";
  const state = { position: game.position, movesCount: game.movesCount };
  return {
    id: game.id,
    mode: game.mode,
    status: game.status,
    intention: game.intention,
    position: game.position,
    movesCount: game.movesCount,
    moves: game.moves.map(toMoveView),
    canRoll: active && canRollLila(state),
    canFinish: active && canFinishLila(state),
  };
}

export function normalizeIntention(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length >= INTENTION_MIN_CHARS && text.length <= LILA_INTENTION_MAX_CHARS ? text : null;
}

// Пусто — записи нет; слишком длинное или не строка — ошибка ввода
export function normalizeNote(value: unknown): string | null | "invalid" {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return "invalid";
  const text = value.trim();
  if (text.length > LILA_NOTE_MAX_CHARS) return "invalid";
  return text === "" ? null : text;
}
```

Run: `pnpm vitest run apps/web/src/lib/lila-view.test.ts` → PASS.

- [ ] **Step 3: Тесты сервиса**

`apps/web/src/server/lila-service.test.ts` (БД — `createTestDb`/`seedUser` из `@oracle/db/testing`; `randomRoll` подменяется):

```ts
import { createTestDb, seedUser } from "@oracle/db/testing";
import type { Database } from "@oracle/db";
import { beforeEach, describe, expect, test } from "vitest";
import { activeGame, finishGame, gameById, importGame, rollGame, saveNote, startGame, type LilaDeps } from "./lila-service";

let db: Database;
let userId: string;
let next = 6;
const deps = (): LilaDeps => ({ db, randomRoll: () => next, now: () => new Date("2026-10-01T10:00:00Z") });
const started = async () => {
  const result = await startGame(deps(), { userId, intention: "Что мне важно увидеть?" });
  if (!result.ok) throw new Error(result.error);
  return result.game;
};

beforeEach(async () => {
  db = await createTestDb();
  userId = (await seedUser(db, { externalId: "svc-1" })).userId;
  next = 6;
});

describe("startGame", () => {
  test("creates a game and rejects a bad intention and a second active game", async () => {
    expect((await started()).moves).toEqual([]);
    expect(await startGame(deps(), { userId, intention: "да" })).toEqual({ ok: false, error: "invalid" });
    expect(await startGame(deps(), { userId, intention: "Ещё одно намерение" })).toEqual({ ok: false, error: "active_exists" });
  });
});

describe("rollGame", () => {
  test("uses the server dice, ignores a client roll unless it is a custom die in 1-6", async () => {
    const game = await started();
    const rolled = await rollGame(deps(), { userId, gameId: game.id, customRoll: undefined });
    expect(rolled).toMatchObject({ ok: true, game: { position: 1, movesCount: 1 } });
    expect(await rollGame(deps(), { userId, gameId: game.id, customRoll: 9 })).toEqual({ ok: false, error: "invalid" });
    const custom = await rollGame(deps(), { userId, gameId: game.id, customRoll: 4 });
    expect(custom).toMatchObject({ ok: true, game: { position: 5 } });
    if (custom.ok) expect(custom.game.moves.at(-1)?.customDie).toBe(true);
  });

  test("a stranger and a bad id get not_found", async () => {
    const game = await started();
    const other = (await seedUser(db, { externalId: "svc-2" })).userId;
    expect(await rollGame(deps(), { userId: other, gameId: game.id, customRoll: undefined })).toEqual({ ok: false, error: "not_found" });
    expect(await rollGame(deps(), { userId, gameId: "not-a-uuid", customRoll: undefined })).toEqual({ ok: false, error: "not_found" });
  });
});

describe("saveNote and finishGame", () => {
  test("saves a note, rejects a long one, closes the game", async () => {
    const game = await started();
    await rollGame(deps(), { userId, gameId: game.id, customRoll: undefined });
    expect((await saveNote(deps(), { userId, gameId: game.id, n: 1, note: " Заметила. " })).ok).toBe(true);
    expect(await saveNote(deps(), { userId, gameId: game.id, n: 1, note: "я".repeat(501) })).toEqual({ ok: false, error: "invalid" });
    expect((await gameById(deps(), { userId, gameId: game.id }))).toMatchObject({ ok: true, game: { moves: [{ note: "Заметила." }] } });
    expect((await finishGame(deps(), { userId, gameId: game.id })).ok).toBe(true);
    expect(await activeGame(deps(), { userId })).toBeNull();
  });
});

describe("importGame", () => {
  const payload = { intention: "Из браузера", moves: [{ roll: 6, custom: false, note: null }, { roll: 5, custom: true, note: "Первая запись" }] };

  test("imports a valid guest game and returns the server view", async () => {
    const result = await importGame(deps(), { userId, payload, replace: false });
    expect(result).toMatchObject({ ok: true, game: { position: 6, movesCount: 2, mode: "free" } });
  });

  test("rejects a malformed payload and an impossible roll", async () => {
    expect(await importGame(deps(), { userId, payload: { intention: 5 }, replace: false })).toEqual({ ok: false, error: "invalid" });
    expect(await importGame(deps(), { userId, payload: { ...payload, moves: [{ roll: 9, custom: false, note: null }] }, replace: false })).toEqual({ ok: false, error: "invalid" });
  });

  test("reports an existing active game unless replace is set", async () => {
    await started();
    expect(await importGame(deps(), { userId, payload, replace: false })).toEqual({ ok: false, error: "active_exists" });
    expect((await importGame(deps(), { userId, payload, replace: true })).ok).toBe(true);
  });
});
```

- [ ] **Step 4: Реализовать сервис**

`apps/web/src/server/lila-service.ts`:

```ts
import { isLilaRoll, LILA_MAX_MOVES } from "@oracle/core";
import { addLilaMove, createLilaGame, finishLilaGame, getActiveLilaGame, getLilaGame, importLilaGame, saveLilaNote, type Database } from "@oracle/db";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { normalizeIntention, normalizeNote, toGameView, type GameView } from "../lib/lila-view";

export type LilaDeps = { db: Database; randomRoll: () => number; now: () => Date };
export type LilaError = "invalid" | "not_found" | "not_active" | "limit" | "at_goal" | "too_early" | "active_exists";
export type LilaResult = { ok: true; game: GameView } | { ok: false; error: LilaError };

const DICE_SIDES = 6;
export const defaultRandomRoll = (): number => randomInt(1, DICE_SIDES + 1);

const fail = (error: LilaError): LilaResult => ({ ok: false, error });
const ok = (game: Parameters<typeof toGameView>[0]): LilaResult => ({ ok: true, game: toGameView(game) });

export async function startGame(deps: LilaDeps, p: { userId: string; intention: unknown }): Promise<LilaResult> {
  const intention = normalizeIntention(p.intention);
  if (!intention) return fail("invalid");
  const created = await createLilaGame(deps.db, { userId: p.userId, intention });
  return created.ok ? ok({ ...created.game, moves: [] }) : fail(created.error);
}

// Бросок делает сервер; число от клиента принимается только как «свой кубик» и только 1–6
export async function rollGame(deps: LilaDeps, p: { userId: string; gameId: string; customRoll: unknown }): Promise<LilaResult> {
  const custom = p.customRoll !== undefined && p.customRoll !== null;
  if (custom && !isLilaRoll(p.customRoll)) return fail("invalid");
  const roll = custom ? (p.customRoll as number) : deps.randomRoll();
  const moved = await addLilaMove(deps.db, { gameId: p.gameId, userId: p.userId, roll, customDie: custom });
  return moved.ok ? ok(moved.game) : fail(moved.error);
}

export async function saveNote(deps: LilaDeps, p: { userId: string; gameId: string; n: unknown; note: unknown }): Promise<LilaResult> {
  const note = normalizeNote(p.note);
  if (note === "invalid" || !Number.isInteger(p.n) || (p.n as number) < 1) return fail("invalid");
  if (!(await saveLilaNote(deps.db, { gameId: p.gameId, userId: p.userId, n: p.n as number, note }))) return fail("not_found");
  return gameById(deps, { userId: p.userId, gameId: p.gameId });
}

export async function finishGame(deps: LilaDeps, p: { userId: string; gameId: string }): Promise<LilaResult> {
  const done = await finishLilaGame(deps.db, { gameId: p.gameId, userId: p.userId, now: deps.now() });
  if (!done.ok) return fail(done.error);
  return gameById(deps, p);
}

export async function gameById(deps: LilaDeps, p: { userId: string; gameId: string }): Promise<LilaResult> {
  const game = await getLilaGame(deps.db, p.gameId);
  return game && game.userId === p.userId ? ok(game) : fail("not_found");
}

export async function activeGame(deps: LilaDeps, p: { userId: string }): Promise<GameView | null> {
  const game = await getActiveLilaGame(deps.db, p.userId);
  return game ? toGameView(game) : null;
}

const importSchema = z.object({
  intention: z.string(),
  moves: z.array(z.object({ roll: z.number(), custom: z.boolean(), note: z.string().nullable() })).max(LILA_MAX_MOVES),
});

export async function importGame(deps: LilaDeps, p: { userId: string; payload: unknown; replace: boolean }): Promise<LilaResult> {
  const parsed = importSchema.safeParse(p.payload);
  const intention = parsed.success ? normalizeIntention(parsed.data.intention) : null;
  if (!parsed.success || !intention) return fail("invalid");
  const notes = parsed.data.moves.map((move) => normalizeNote(move.note));
  if (notes.includes("invalid")) return fail("invalid");
  const imported = await importLilaGame(deps.db, {
    userId: p.userId,
    intention,
    moves: parsed.data.moves.map((move, index) => ({ roll: move.roll, customDie: move.custom, note: notes[index] as string | null })),
    replaceActive: p.replace,
  });
  return imported.ok ? ok(imported.game) : fail(imported.error);
}
```

Run: `pnpm vitest run apps/web/src/server/lila-service.test.ts` → PASS.

- [ ] **Step 5: Общий обработчик маршрутов**

В `apps/web/src/server/rate-limit.ts` рядом с остальными лимитерами добавить (константа — рядом с прочими лимитами):

```ts
const LILA_ACTIONS_PER_MINUTE = 60;
// Броски, записи и перенос партии: ход — короткая операция, но перебор должен упираться в лимит
export const lilaLimiter = createRateLimiter({ limit: LILA_ACTIONS_PER_MINUTE, windowMs: MINUTE_MS });
```

`apps/web/src/server/lila-route.ts`:

```ts
import type { UserRecord } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "./db";
import { loginDeps } from "./deps";
import { isSameOrigin, SESSION_COOKIE } from "./http";
import { getCurrentUser } from "./login-service";
import { clientKeyFromHeaders, lilaLimiter } from "./rate-limit";
import { defaultRandomRoll, type LilaDeps, type LilaError, type LilaResult } from "./lila-service";
import { getEnv } from "./env";

const STATUS: Record<LilaError, number> = { invalid: 400, not_found: 404, not_active: 409, limit: 409, at_goal: 409, too_early: 409, active_exists: 409 };

export const lilaDeps = (): LilaDeps => ({ db: getDb(), randomRoll: defaultRandomRoll, now: () => new Date() });

export const lilaResponse = (result: LilaResult): NextResponse =>
  result.ok ? NextResponse.json(result, { headers: { "cache-control": "no-store" } }) : NextResponse.json(result, { status: STATUS[result.error] });

type Handler = (p: { user: UserRecord; body: Record<string, unknown>; deps: LilaDeps }) => Promise<NextResponse>;

// Общая проверка всех POST-маршрутов партий: тот же сайт, вход, лимит запросов, тело — объект JSON
export async function lilaPost(request: NextRequest, handler: Handler): Promise<NextResponse> {
  const login = loginDeps();
  if (!isSameOrigin(request, getEnv().APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  const user = await getCurrentUser(login, request.cookies.get(SESSION_COOKIE)?.value ?? null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!lilaLimiter.allow(`${user.id}:${clientKeyFromHeaders(request.headers)}`)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const raw: unknown = await request.json().catch(() => null);
  const body = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return handler({ user, body, deps: lilaDeps() });
}

export async function lilaUser(request: NextRequest): Promise<UserRecord | null> {
  return getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
}
```

- [ ] **Step 6: Маршруты**

`apps/web/src/app/api/lila/games/route.ts`:

```ts
import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { startGame } from "@/server/lila-service";

export const POST = (request: NextRequest) => lilaPost(request, async ({ user, body, deps }) => lilaResponse(await startGame(deps, { userId: user.id, intention: body.intention })));
```

`apps/web/src/app/api/lila/games/active/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { lilaDeps, lilaUser } from "@/server/lila-route";
import { activeGame } from "@/server/lila-service";

export async function GET(request: NextRequest) {
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, game: await activeGame(lilaDeps(), { userId: user.id }) }, { headers: { "cache-control": "no-store" } });
}
```

`apps/web/src/app/api/lila/games/[id]/roll/route.ts` (аналогично `note`, `finish`):

```ts
import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { rollGame } from "@/server/lila-service";

export const POST = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  lilaPost(request, async ({ user, body, deps }) => lilaResponse(await rollGame(deps, { userId: user.id, gameId: (await params).id, customRoll: body.roll })));
```

`note/route.ts`: вызывает `saveNote(deps, { userId, gameId, n: body.n, note: body.note })`. `finish/route.ts`: `finishGame(deps, { userId, gameId })`.

`apps/web/src/app/api/lila/import/route.ts`:

```ts
import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { importGame } from "@/server/lila-service";

export const POST = (request: NextRequest) =>
  lilaPost(request, async ({ user, body, deps }) => lilaResponse(await importGame(deps, { userId: user.id, payload: body.game, replace: body.replace === true })));
```

- [ ] **Step 7: Проверки и ревью**

Run: `pnpm vitest run apps/web/src && pnpm --filter @oracle/web typecheck`
Expected: PASS.

Полное ревью исполнителем-ревьюером: доступ только владельцу, проверка origin, лимит, невозможность подсунуть положение фишки, замена активной партии, единая нормализация ввода.

```bash
git add apps/web/src/lib/lila-view.ts apps/web/src/lib/lila-view.test.ts apps/web/src/server apps/web/src/app/api/lila
git commit -m "feat(web): Lila game service and API"
```

---

### Task 5: Описание хода, гостевая партия и клиенты API (`apps/web/src/lib`)

**Files:**
- Create: `apps/web/src/lib/lila-turn.ts`, `lila-turn.test.ts`
- Create: `apps/web/src/lib/lila-guest.ts`, `lila-guest.test.ts`
- Create: `apps/web/src/lib/lila-api.ts`, `lila-api.test.ts`
- Create: `apps/web/src/lib/lila-themes.ts`
- Create: `apps/web/src/lib/lila-paths.ts`, `lila-paths.test.ts`

**Interfaces:**
- Consumes: `GameView`, `MoveView`, `toGameView`, `normalizeNote` (Task 4); `applyLilaRoll`, `replayLila`, `lilaVisitCounts`, `lilaQuestionIndex`, `LILA_*` (Task 1); `LilaCell` (Task 2).
- Produces:
  - `lila-turn.ts`: `type Turn`, `describeTurn(view: GameView, index: number, cellOf: (n: number) => LilaCell): Turn`, `openedCells(view: GameView): number`, `trailOf(view: GameView): number[]`
  - `lila-guest.ts`: `GUEST_KEY`, `type GuestGame = { intention: string; moves: { roll: number; custom: boolean; note: string | null }[]; finished: boolean }`, `readGuestGame(storage): GuestGame | null`, `writeGuestGame(storage, game)`, `clearGuestGame(storage)`, `guestView(game): GameView`, `guestStart(intention): GuestGame`, `guestRoll(game, roll, custom): GuestGame`, `guestNote(game, n, note): GuestGame`, `guestFinish(game): GuestGame`
  - `lila-api.ts`: `type GameApi = { roll(customRoll?: number): Promise<ApiResult>; saveNote(n: number, note: string): Promise<ApiResult>; finish(): Promise<ApiResult> }`, `type ApiResult = { ok: true; game: GameView } | { ok: false; error: string }`, `serverApi(gameId): GameApi`, `guestApi(storage, random?): GameApi`, `startServerGame(intention)`, `importGuestGame(game, replace)`, `lilaErrorMessage(error)`
  - `lila-themes.ts`: `LILA_THEMES: readonly { label: string; intention: string }[]`
  - `lila-paths.ts`: `LILA_PATH`, `LILA_GAME_PATH`, `lilaParam`, `lilaCellPath`, `lilaCellFromParam`, `lilaCellImage`, `LILA_IMAGES_READY`, `lilaCellJsonLd`, `lilaHistoryPath(gameId)`

- [ ] **Step 1: Тесты описания хода**

`apps/web/src/lib/lila-turn.test.ts`:

```ts
import type { LilaCell } from "@oracle/content/lila";
import { describe, expect, test } from "vitest";
import { describeTurn, openedCells, trailOf } from "./lila-turn";
import { toGameView } from "./lila-view";

const cellOf = (n: number): LilaCell => ({
  number: n,
  name: `Клетка ${n}`,
  slug: "kletka",
  about: `О клетке ${n}`,
  questions: [`Вопрос 1 клетки ${n}?`, `Вопрос 2 клетки ${n}?`, `Вопрос 3 клетки ${n}?`],
  transition: n === 12 ? "Вы возвращаетесь к теме." : null,
});
const move = (n: number, from: number, landed: number, to: number, roll: number, transition: "none" | "snake" | "arrow" = "none", note: string | null = null) => ({ n, roll, from, landed, to, transition, customDie: false, note });
const view = (moves: ReturnType<typeof move>[]) =>
  toGameView({ id: "g", mode: "free", status: "active", intention: "Что мне важно?", position: moves.at(-1)?.to ?? 0, movesCount: moves.length, moves });

describe("describeTurn", () => {
  test("a wasted start asks what the player notices while waiting", () => {
    const turn = describeTurn(view([move(1, 0, 0, 0, 3)]), 0, cellOf);
    expect(turn).toMatchObject({ kind: "wait", landed: null, arrival: null });
    expect(turn.question).toMatch(/шестёрк/);
  });

  test("the entry shows cell 1 with its first question", () => {
    expect(describeTurn(view([move(1, 0, 1, 1, 6)]), 0, cellOf)).toMatchObject({ kind: "entry", question: "Вопрос 1 клетки 1?", visit: 1 });
  });

  test("a snake shows the landing cell, its transition line and the arrival cell with its question", () => {
    const turn = describeTurn(view([move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake")]), 1, cellOf);
    expect(turn).toMatchObject({ kind: "step", transitionText: "Вы возвращаетесь к теме.", question: "Вопрос 1 клетки 8?" });
    expect(turn.landed?.number).toBe(12);
    expect(turn.arrival?.number).toBe(8);
  });

  test("a repeated visit uses the next question and shows the previous note", () => {
    const moves = [move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake", "Первая запись"), move(3, 8, 12, 8, 4, "snake")];
    const turn = describeTurn(view(moves), 2, cellOf);
    expect(turn).toMatchObject({ visit: 2, question: "Вопрос 2 клетки 8?", previousNote: "Первая запись" });
  });

  test("the goal is reported as such", () => {
    expect(describeTurn(view([move(1, 67, 68, 68, 1)]), 0, cellOf).kind).toBe("goal");
  });

  test("a wasted move on the field says how far the goal is", () => {
    const turn = describeTurn(view([move(1, 66, 66, 66, 5)]), 0, cellOf);
    expect(turn).toMatchObject({ kind: "wait" });
    expect(turn.question).toMatch(/2/);
  });
});

describe("openedCells and trailOf", () => {
  const moves = [move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake"), move(3, 8, 8, 8, 1)];
  test("count distinct opened cells, ignoring wasted moves", () => {
    expect(openedCells(view(moves.slice(0, 2)))).toBe(3);
  });
  test("the trail lists the cells the piece went through without repeats in a row", () => {
    expect(trailOf(view(moves.slice(0, 2)))).toEqual([1, 12, 8]);
  });
});
```

- [ ] **Step 2: Реализовать описание хода**

`apps/web/src/lib/lila-turn.ts`:

```ts
import { LILA_GOAL_CELL, lilaQuestionIndex, lilaVisitCounts } from "@oracle/core";
import type { LilaCell } from "@oracle/content/lila";
import type { GameView } from "./lila-view";

export type Turn = {
  kind: "wait" | "entry" | "step" | "goal";
  roll: number;
  landed: LilaCell | null; // клетка падения (голова змеи, начало стрелы или обычная клетка)
  arrival: LilaCell | null; // итоговая клетка, если она отличается от клетки падения
  transitionText: string | null;
  visit: number; // какой по счёту визит на итоговую клетку
  question: string;
  previousNote: string | null; // запись с прошлого визита на итоговую клетку
};

const pick = (cell: LilaCell, visit: number) => cell.questions[lilaQuestionIndex(visit)];

function waitQuestion(position: number, roll: number): string {
  if (position === 0) return `Выпало ${roll}. Для начала игры нужна шестёрка. Что вы замечаете, пока ждёте?`;
  const left = (position < LILA_GOAL_CELL ? LILA_GOAL_CELL : 72) - position;
  return `Выпало ${roll}, а до конца пути ${left}. Что вы замечаете, пока ждёте нужного броска?`;
}

export function describeTurn(view: GameView, index: number, cellOf: (n: number) => LilaCell): Turn {
  const move = view.moves[index]!;
  if (move.wasted) return { kind: "wait", roll: move.roll, landed: null, arrival: null, transitionText: null, visit: 0, question: waitQuestion(move.from, move.roll), previousNote: null };

  const upTo = view.moves.slice(0, index + 1);
  const visits = lilaVisitCounts(upTo);
  const landed = cellOf(move.landed);
  const arrival = move.to !== move.landed ? cellOf(move.to) : null;
  const finalCell = arrival ?? landed;
  const visit = visits.get(finalCell.number) ?? 1;
  const previous = view.moves.slice(0, index).findLast((earlier) => !earlier.wasted && earlier.note && (earlier.to === finalCell.number || earlier.landed === finalCell.number));
  return {
    kind: move.entered ? "entry" : move.reachedGoal ? "goal" : "step",
    roll: move.roll,
    landed,
    arrival,
    transitionText: arrival ? landed.transition : null,
    visit,
    question: pick(finalCell, visit),
    previousNote: visit > 1 ? (previous?.note ?? null) : null,
  };
}

export const openedCells = (view: GameView): number => lilaVisitCounts(view.moves).size;

export function trailOf(view: GameView): number[] {
  const cells: number[] = [];
  for (const move of view.moves) {
    if (move.wasted) continue;
    for (const cell of move.landed === move.to ? [move.to] : [move.landed, move.to]) if (cells.at(-1) !== cell) cells.push(cell);
  }
  return cells;
}
```

Run: `pnpm vitest run apps/web/src/lib/lila-turn.test.ts` → PASS.

- [ ] **Step 3: Тесты гостевой партии**

`apps/web/src/lib/lila-guest.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { clearGuestGame, guestFinish, guestNote, guestRoll, guestStart, guestView, GUEST_KEY, readGuestGame, writeGuestGame } from "./lila-guest";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), data };
};

describe("a guest game", () => {
  test("replays its rolls into the same view the server would build", () => {
    let game = guestStart("Что мне важно увидеть?");
    game = guestRoll(game, 6, false);
    game = guestRoll(game, 5, true);
    game = guestRoll(game, 6, false);
    const view = guestView(game);
    expect(view).toMatchObject({ id: "guest", mode: "free", status: "active", position: 8, movesCount: 3, canRoll: true, canFinish: false });
    expect(view.moves[1]).toMatchObject({ customDie: true, landed: 6 });
    expect(view.moves[2]).toMatchObject({ landed: 12, to: 8, transition: "snake" });
  });

  test("keeps notes, refuses a roll after the goal or after finishing, and finishes early as a closed game", () => {
    let game = guestRoll(guestStart("Что мне важно увидеть?"), 6, false);
    game = guestNote(game, 1, "Заметила.");
    expect(guestView(game).moves[0]?.note).toBe("Заметила.");
    game = guestFinish(game);
    expect(guestView(game).status).toBe("abandoned");
    expect(() => guestRoll(game, 1, false)).toThrow();
  });

  test("survives a round trip through storage and drops corrupt data", () => {
    const storage = memory();
    const game = guestRoll(guestStart("Что мне важно увидеть?"), 6, false);
    writeGuestGame(storage, game);
    expect(readGuestGame(storage)).toEqual(game);
    storage.data.set(GUEST_KEY, "{oops");
    expect(readGuestGame(storage)).toBeNull();
    storage.data.set(GUEST_KEY, JSON.stringify({ intention: "Что мне важно увидеть?", moves: [{ roll: 9, custom: false, note: null }], finished: false }));
    expect(readGuestGame(storage)).toBeNull();
    writeGuestGame(storage, game);
    clearGuestGame(storage);
    expect(readGuestGame(storage)).toBeNull();
  });

  test("works without storage", () => {
    expect(readGuestGame(null)).toBeNull();
    expect(() => writeGuestGame(null, guestStart("Что мне важно увидеть?"))).not.toThrow();
  });
});
```

- [ ] **Step 4: Реализовать гостевую партию**

`apps/web/src/lib/lila-guest.ts`:

```ts
import { isLilaRoll, LILA_MAX_MOVES, LILA_NOTE_MAX_CHARS, replayLila } from "@oracle/core";
import { toGameView, type GameView } from "./lila-view";

export const GUEST_KEY = "lila:game:v1";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type GuestMove = { roll: number; custom: boolean; note: string | null };
export type GuestGame = { intention: string; moves: GuestMove[]; finished: boolean };

export const guestStart = (intention: string): GuestGame => ({ intention, moves: [], finished: false });

export function guestView(game: GuestGame): GameView {
  const { position, results } = replayLila(game.moves.map((move) => move.roll));
  const moves = results.map((result, index) => ({
    n: index + 1,
    roll: result.roll,
    from: result.from,
    landed: result.landed,
    to: result.to,
    transition: result.transition,
    customDie: game.moves[index]!.custom,
    note: game.moves[index]!.note,
  }));
  const finishable = position === 68 || moves.length >= 10;
  return toGameView({
    id: "guest",
    mode: "free",
    status: game.finished ? (finishable ? "finished" : "abandoned") : "active",
    intention: game.intention,
    position,
    movesCount: moves.length,
    moves,
  });
}

export function guestRoll(game: GuestGame, roll: number, custom: boolean): GuestGame {
  const view = guestView(game);
  if (game.finished || !view.canRoll || !isLilaRoll(roll)) throw new Error("roll is not possible");
  return { ...game, moves: [...game.moves, { roll, custom, note: null }] };
}

export function guestNote(game: GuestGame, n: number, note: string | null): GuestGame {
  if (game.finished || n < 1 || n > game.moves.length || (note !== null && note.length > LILA_NOTE_MAX_CHARS)) throw new Error("note is not possible");
  return { ...game, moves: game.moves.map((move, index) => (index === n - 1 ? { ...move, note } : move)) };
}

export const guestFinish = (game: GuestGame): GuestGame => ({ ...game, finished: true });

// Хранилище может быть недоступно или испорчено — тогда партия просто начнётся заново
export function readGuestGame(storage: StorageLike | null): GuestGame | null {
  try {
    const raw = storage?.getItem(GUEST_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as GuestGame;
    if (typeof value.intention !== "string" || !Array.isArray(value.moves) || value.moves.length > LILA_MAX_MOVES) return null;
    // Невозможный порядок бросков (в том числе после цели) replayLila отвергает исключением
    replayLila(value.moves.map((move) => move.roll));
    return value;
  } catch {
    return null;
  }
}

export function writeGuestGame(storage: StorageLike | null, game: GuestGame): void {
  try {
    storage?.setItem(GUEST_KEY, JSON.stringify(game));
  } catch {
    // партия живёт до перезагрузки страницы
  }
}

export function clearGuestGame(storage: StorageLike | null): void {
  try {
    storage?.removeItem(GUEST_KEY);
  } catch {
    // нечего очищать
  }
}
```

Run: `pnpm vitest run apps/web/src/lib/lila-guest.test.ts` → PASS.

- [ ] **Step 5: Клиенты API и сообщения об ошибках**

`apps/web/src/lib/lila-api.ts`:

```ts
import { getRandomRoll } from "./lila-dice";
import { clearGuestGame, guestFinish, guestNote, guestRoll, guestView, readGuestGame, writeGuestGame, type GuestGame } from "./lila-guest";
import type { GameView } from "./lila-view";

export type ApiResult = { ok: true; game: GameView } | { ok: false; error: string };
export type GameApi = {
  roll(customRoll?: number): Promise<ApiResult>;
  saveNote(n: number, note: string): Promise<ApiResult>;
  finish(): Promise<ApiResult>;
};
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const MESSAGES: Record<string, string> = {
  invalid: "Проверьте введённое: намерение — от 3 до 300 знаков, запись — до 500.",
  not_found: "Партия не найдена. Обновите страницу.",
  not_active: "Партия уже закрыта.",
  limit: "Достигнут лимит в 120 ходов. Партию можно завершить.",
  at_goal: "Вы уже на клетке 68. Партию можно завершить.",
  too_early: "Партию можно завершить после клетки 68 или с десятого хода.",
  active_exists: "В портрете уже есть активная партия.",
  rate_limited: "Слишком много запросов. Подождите минуту.",
  unauthorized: "Нужно войти через VK ID.",
};
export const lilaErrorMessage = (error: string): string => MESSAGES[error] ?? "Не получилось. Попробуйте ещё раз.";

async function post(url: string, body: unknown): Promise<ApiResult> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; game?: GameView; error?: string } | null;
    if (data?.ok && data.game) return { ok: true, game: data.game };
    return { ok: false, error: data?.error ?? "network" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export const startServerGame = (intention: string): Promise<ApiResult> => post("/api/lila/games", { intention });
export const importGuestGame = (game: GuestGame, replace: boolean): Promise<ApiResult> => post("/api/lila/import", { game, replace });

export const serverApi = (gameId: string): GameApi => ({
  roll: (customRoll) => post(`/api/lila/games/${gameId}/roll`, customRoll === undefined ? {} : { roll: customRoll }),
  saveNote: (n, note) => post(`/api/lila/games/${gameId}/note`, { n, note }),
  finish: () => post(`/api/lila/games/${gameId}/finish`, {}),
});

// Гость играет по тем же правилам, но целиком в браузере; бросок — из crypto.getRandomValues
export function guestApi(storage: StorageLike | null, random: () => number = getRandomRoll): GameApi {
  const run = (change: (game: GuestGame) => GuestGame): ApiResult => {
    const game = readGuestGame(storage);
    if (!game) return { ok: false, error: "not_found" };
    try {
      const next = change(game);
      writeGuestGame(storage, next);
      return { ok: true, game: guestView(next) };
    } catch {
      return { ok: false, error: "not_active" };
    }
  };
  return {
    roll: async (customRoll) => run((game) => guestRoll(game, customRoll ?? random(), customRoll !== undefined)),
    saveNote: async (n, note) => run((game) => guestNote(game, n, note.trim() === "" ? null : note.trim())),
    finish: async () => run(guestFinish),
  };
}

export { clearGuestGame };
```

`apps/web/src/lib/lila-dice.ts`:

```ts
const DICE_SIDES = 6;
// Отсечение хвоста исключает перекос: 256 не делится на 6 без остатка
const LIMIT = 252;

export function getRandomRoll(): number {
  const buffer = new Uint8Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0]! >= LIMIT);
  return (buffer[0]! % DICE_SIDES) + 1;
}
```

Тесты `lila-api.test.ts`: `guestApi` с памятью — бросок с `random = () => 6` добавляет ход, повторный «свой кубик» 4 помечает `customDie`, `finish` закрывает партию, без сохранённой партии → `{ ok:false, error:"not_found" }`; `lilaErrorMessage("unknown")` возвращает общий текст. Тест `lila-dice.test.ts`: 600 бросков дают числа только 1–6 и все шесть значений встречаются.

- [ ] **Step 6: Темы и адреса**

`apps/web/src/lib/lila-themes.ts`:

```ts
// Готовые формулировки намерения: не пол-зависимые, от первого лица
export const LILA_THEMES: readonly { label: string; intention: string }[] = [
  { label: "Отношения", intention: "Что мне важно увидеть в моих отношениях?" },
  { label: "Работа", intention: "Куда мне двигаться в работе и деле?" },
  { label: "Выбор", intention: "Почему мне трудно принять это решение?" },
  { label: "Деньги", intention: "Что мешает мне двигаться в вопросе денег?" },
  { label: "Перемены", intention: "Что удерживает меня от следующего шага?" },
  { label: "О себе", intention: "Чего я на самом деле хочу?" },
];
```

`apps/web/src/lib/lila-paths.ts`:

```ts
import { LILA_CELLS, type LilaCell } from "@oracle/content/lila";
import { shortDescription } from "./arcana-paths";

export const LILA_PATH = "/lila";
export const LILA_GAME_PATH = "/lila/igra";
const PARAM = /^(\d{2})-([a-z]+(?:-[a-z]+)*)$/;

type CellRef = { number: number; slug: string };

export const lilaParam = (cell: CellRef): string => `${String(cell.number).padStart(2, "0")}-${cell.slug}`;
export const lilaCellPath = (cell: CellRef): string => `${LILA_PATH}/kletki/${lilaParam(cell)}`;
export const lilaHistoryPath = (gameId: string): string => `/portret/lila/${gameId}`;

// Номер и slug должны совпасть с одной и той же клеткой — иначе 404, а не страница с чужим текстом
export function lilaCellFromParam(param: string): LilaCell | null {
  const match = PARAM.exec(param);
  if (!match) return null;
  const cell = LILA_CELLS.find((item) => item.number === Number(match[1]));
  return cell && cell.slug === match[2] ? cell : null;
}

// Иллюстрации в public/lila: 960 px — страница клетки и превью ссылок, 480 px — карточка хода, 160 px — сетка клеток.
// Пока картинки добавляются пачками, у клетки без файла показывается запасная карточка; когда готовы все 72, установить true
export const LILA_IMAGES_READY = false;
const IMAGE_SUFFIX = { page: "", card: "-480", thumb: "-160" } as const;
export type LilaImageSize = keyof typeof IMAGE_SUFFIX;
export const lilaImageFile = (cell: CellRef, size: LilaImageSize = "page"): string => `${lilaParam(cell)}${IMAGE_SUFFIX[size]}.webp`;
export const lilaCellImage = (cell: CellRef, size: LilaImageSize = "page"): string => `/lila/${lilaImageFile(cell, size)}`;

export const lilaCellDescription = (cell: LilaCell): string => shortDescription(cell.about);

export function lilaCellJsonLd(cell: LilaCell, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Клетка ${cell.number} «${cell.name}» в игре Лила`,
    description: lilaCellDescription(cell),
    inLanguage: "ru",
    mainEntityOfPage: `${siteUrl}${lilaCellPath(cell)}`,
    image: `${siteUrl}${lilaCellImage(cell)}`,
  };
}

```

`lila-paths.test.ts` — проверки: `lilaCellFromParam("12-zavist")` → клетка 12; `"12-alchnost"` → `null` (номер и slug не сошлись); `"12"` → `null`; `lilaCellPath(cell12)` = `/lila/kletki/12-zavist`; `lilaCellImage(cell, "thumb")` заканчивается на `-160.webp`; **согласованность источников**: имена и таблицы из `board-data.ts` совпадают с текстами и ядром:

```ts
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import { ARROWS, CELLS, SNAKES } from "@/components/lila/board-data";
import { LILA_CELLS } from "@oracle/content/lila";

test("the board data agrees with the texts and the engine", () => {
  expect(CELLS.map((c) => c.name)).toEqual(LILA_CELLS.map((c) => c.name));
  expect(Object.fromEntries(SNAKES.map((s) => [s.from, s.to]))).toEqual(LILA_SNAKES);
  expect(Object.fromEntries(ARROWS.map((s) => [s.from, s.to]))).toEqual(LILA_ARROWS);
});
```

и «картинки»: тест, который перечисляет файлы, которых нет в `apps/web/public/lila` (три размера у всех 72), и падает только при `LILA_IMAGES_READY === true` (иначе — `console.info` со списком и выход).

- [ ] **Step 7: Запустить и закоммитить**

Run: `pnpm vitest run apps/web/src/lib && pnpm --filter @oracle/web typecheck`
Expected: PASS. Если тест согласованности показал расхождение в названиях — исправить текст клетки в `lila-cells.md`, а не `board-data.ts`.

```bash
git add apps/web/src/lib
git commit -m "feat(web): Lila turn description, guest game and API clients"
```

---

### Task 6: Экран игры — намерение, ход, кубик (`/lila/igra`)

**Files:**
- Create: `apps/web/src/components/lila/GameShell.tsx`, `IntentionForm.tsx`, `GamePlay.tsx`, `TurnPanel.tsx`, `DiceControls.tsx`, `CellArt.tsx`, `CellFallback.tsx`
- Create: `apps/web/src/server/lila-images.ts`
- Create: `apps/web/src/app/lila/igra/page.tsx`

**Interfaces:**
- Consumes: `GameView`, `describeTurn`, `openedCells`, `trailOf`, `guestApi`, `serverApi`, `startServerGame`, `guestStart`, `readGuestGame`, `writeGuestGame`, `guestView`, `LILA_THEMES`, `Board`, `lilaCellByNumber`/`LILA_CELLS`, `activeGame`.
- Produces: страница `/lila/igra`, пропсы `GameShell({ initialGame: GameView | null; signedIn: boolean; images: string[] })`; `lila-images.ts`: `availableCellImages(): string[]` (имена файлов из `public/lila`).

Экран строится по каркасу `docs/design/wireframes/lila.html` (экраны 2–4) и макетам Codex; в этом плане — функциональная разметка с классами `lila-*`, оформление — в Task 11.

- [ ] **Step 1: Список картинок клеток**

`apps/web/src/server/lila-images.ts`:

```ts
import { readdirSync } from "node:fs";
import { join } from "node:path";

// Файлы иллюстраций клеток, которые уже лежат в public/lila. Читается при сборке и запросе страницы, не в браузере
export function availableCellImages(): string[] {
  try {
    return readdirSync(join(process.cwd(), "public", "lila")).filter((name) => name.endsWith(".webp"));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Запасная карточка и картинка клетки**

`apps/web/src/components/lila/CellFallback.tsx`:

```tsx
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";

// Запасная карточка: номер и значок вида клетки; картинка добавится пачкой без правок кода
export function CellFallback({ number, size }: { number: number; size: "page" | "card" | "thumb" }) {
  const kind = number in LILA_SNAKES ? "snake" : number in LILA_ARROWS ? "arrow" : "plain";
  const row = Math.floor((number - 1) / 9);
  return (
    <div className={`lila-fallback lila-fallback--${size} lila-fallback--row-${row}`} role="img" aria-label={`Клетка ${number}`}>
      <span className="lila-fallback__number">{number}</span>
      <span className="lila-fallback__mark" aria-hidden="true">
        {kind === "snake" ? "↓" : kind === "arrow" ? "↑" : "•"}
      </span>
    </div>
  );
}
```

`apps/web/src/components/lila/CellArt.tsx`:

```tsx
import Image from "next/image";
import { lilaImageFile, lilaCellImage, type LilaImageSize } from "@/lib/lila-paths";
import { CellFallback } from "./CellFallback";

type Props = { cell: { number: number; slug: string; name: string }; size?: LilaImageSize; available: readonly string[]; priority?: boolean };
const PIXELS = { page: 960, card: 480, thumb: 160 } as const;

export function CellArt({ cell, size = "card", available, priority }: Props) {
  if (!available.includes(lilaImageFile(cell, size))) return <CellFallback number={cell.number} size={size} />;
  return <Image className={`lila-art lila-art--${size}`} src={lilaCellImage(cell, size)} alt={`Клетка ${cell.number} «${cell.name}»`} width={PIXELS[size]} height={PIXELS[size]} priority={priority} unoptimized />;
}
```

- [ ] **Step 3: Форма намерения**

`apps/web/src/components/lila/IntentionForm.tsx`:

```tsx
"use client";

import { LILA_INTENTION_MAX_CHARS } from "@oracle/core";
import { useState } from "react";
import { LILA_THEMES } from "@/lib/lila-themes";

type Props = { busy: boolean; error: string | null; onStart: (intention: string) => void };

export function IntentionForm({ busy, error, onStart }: Props) {
  const [text, setText] = useState("");
  const ready = text.trim().length >= 3;
  return (
    <form
      className="card stack lila-setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onStart(text);
      }}
    >
      <h2 id="intention-title">Какой вопрос вы хотите исследовать?</h2>
      <div className="row lila-setup__themes" role="group" aria-label="Готовые темы">
        {LILA_THEMES.map((theme) => (
          <button key={theme.label} type="button" className="chip" onClick={() => setText(theme.intention)}>
            {theme.label}
          </button>
        ))}
      </div>
      <label className="stack">
        <span>Или напишите своё намерение</span>
        <textarea className="input" rows={3} maxLength={LILA_INTENTION_MAX_CHARS} value={text} onChange={(event) => setText(event.target.value)} aria-describedby="intention-hint" />
        <span id="intention-hint" className="muted">
          {text.length} / {LILA_INTENTION_MAX_CHARS}. Лучше одно личное и конкретное: «Почему мне трудно принять решение о работе?»
        </span>
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button button--lavender" disabled={!ready || busy}>
        Играть
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Кубик**

`apps/web/src/components/lila/DiceControls.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = { busy: boolean; onRoll: (customRoll?: number) => void };

export function DiceControls({ busy, onRoll }: Props) {
  const [own, setOwn] = useState(false);
  return (
    <div className="stack lila-dice">
      <div className="row">
        <button type="button" className="button button--lavender" disabled={busy} onClick={() => onRoll()}>
          Бросить кубик
        </button>
        <button type="button" className="button button--ghost" aria-expanded={own} onClick={() => setOwn((value) => !value)}>
          Играю со своим кубиком
        </button>
      </div>
      {own && (
        <div className="row" role="group" aria-label="Что выпало на вашем кубике">
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <button key={value} type="button" className="chip lila-dice__face" disabled={busy} aria-label={`Выпало ${value}`} onClick={() => onRoll(value)}>
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Панель хода**

`apps/web/src/components/lila/TurnPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { LILA_NOTE_MAX_CHARS } from "@oracle/core";
import type { Turn } from "@/lib/lila-turn";
import { CellArt } from "./CellArt";

type Props = {
  turn: Turn | null;
  moveNumber: number;
  note: string | null;
  images: readonly string[];
  editable: boolean;
  onSaveNote: (note: string) => Promise<boolean>;
};

export function TurnPanel({ turn, moveNumber, note, images, editable, onSaveNote }: Props) {
  const [draft, setDraft] = useState(note ?? "");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft(note ?? "");
    setSaved(false);
  }, [moveNumber, note]);

  if (!turn) return <p className="lead">Бросьте кубик. Чтобы начать путь, нужна шестёрка.</p>;
  const finalCell = turn.arrival ?? turn.landed;
  return (
    <section className="card stack lila-turn" aria-labelledby="turn-title">
      <p role="status" className="eyebrow">
        Ход {moveNumber} · выпало {turn.roll}
        {turn.visit > 1 && ` · вы здесь уже были (${turn.visit}-й раз)`}
      </p>
      {turn.kind === "wait" || !finalCell ? (
        <>
          <h2 id="turn-title">Пауза</h2>
          <p className="lead">{turn.question}</p>
        </>
      ) : (
        <>
          {turn.arrival && turn.landed && (
            <>
              <p className="eyebrow">
                Клетка {turn.landed.number} · «{turn.landed.name}»
              </p>
              <p>{turn.landed.about}</p>
              {turn.transitionText && <p className="lila-turn__transition">{turn.transitionText}</p>}
            </>
          )}
          <div className="lila-turn__cell">
            <CellArt cell={finalCell} available={images} priority />
            <div className="stack">
              <p className="eyebrow">Клетка {finalCell.number}</p>
              <h2 id="turn-title">{finalCell.name}</h2>
            </div>
          </div>
          {!turn.arrival && <p>{finalCell.about}</p>}
          <p className="lila-turn__question">
            <strong>Вопрос:</strong> {turn.question}
          </p>
          {turn.previousNote && <p className="muted">Ваша прошлая запись здесь: «{turn.previousNote}»</p>}
        </>
      )}
      {editable && (
        <label className="stack">
          <span>Записать мысль (по желанию)</span>
          <textarea className="input" rows={3} maxLength={LILA_NOTE_MAX_CHARS} value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false); }} />
          <span className="row">
            <button
              type="button"
              className="button button--ghost"
              disabled={draft === (note ?? "")}
              onClick={async () => setSaved(await onSaveNote(draft))}
            >
              Сохранить
            </button>
            {saved && <span role="status">Сохранено.</span>}
          </span>
        </label>
      )}
    </section>
  );
}
```

(Кнопка «Сохранить» — текст из AGENTS.md; отметка «Сохранено.» — уже закреплена в AGENTS.md для матрицы и здесь используется тем же текстом.)

- [ ] **Step 6: Партия**

`apps/web/src/components/lila/GamePlay.tsx`:

```tsx
"use client";

import { LILA_CELLS, lilaCellByNumber } from "@oracle/content/lila";
import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { lilaErrorMessage, type GameApi } from "@/lib/lila-api";
import { describeTurn, openedCells, trailOf } from "@/lib/lila-turn";
import type { GameView } from "@/lib/lila-view";
import { Board } from "./Board";
import { DiceControls } from "./DiceControls";
import { MoveHistory } from "./MoveHistory";
import { TurnPanel } from "./TurnPanel";

type Props = { initial: GameView; api: GameApi; images: readonly string[]; onClosed: (game: GameView) => void };
type Tab = "turn" | "board" | "history";

export function GamePlay({ initial, api, images, onClosed }: Props) {
  const [game, setGame] = useState(initial);
  const [tab, setTab] = useState<Tab>("turn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run(action: () => ReturnType<GameApi["roll"]>): Promise<boolean> {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(lilaErrorMessage(result.error));
      return false;
    }
    setGame(result.game);
    return true;
  }

  const lastIndex = game.moves.length - 1;
  const turn = lastIndex >= 0 ? describeTurn(game, lastIndex, lilaCellByNumber) : null;
  const last = lastIndex >= 0 ? game.moves[lastIndex]! : null;

  async function finish() {
    setBusy(true);
    const result = await api.finish();
    setBusy(false);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    reachGoal("lila_finish");
    onClosed(result.game);
  }

  return (
    <div className="stack lila-play">
      <header className="lila-play__bar">
        <p className="tag">Намерение: {game.intention}</p>
        <p>
          Ходов {game.movesCount} · Открыто клеток: {openedCells(game)} из {LILA_CELLS.length}
        </p>
      </header>
      <div className="row lila-tabs" role="tablist" aria-label="Разделы партии">
        {(["turn", "board", "history"] as const).map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="lila-tabs__tab" onClick={() => setTab(id)}>
            {id === "turn" ? "Ход" : id === "board" ? "Поле" : "История"}
          </button>
        ))}
      </div>
      <div className="lila-play__layout">
        <div className="stack lila-play__side" hidden={tab !== "turn"}>
          <TurnPanel
            turn={turn}
            moveNumber={game.movesCount}
            note={last?.note ?? null}
            images={images}
            editable={game.status === "active" && last !== null}
            onSaveNote={(note) => run(() => api.saveNote(game.movesCount, note))}
          />
          {game.canRoll && <DiceControls busy={busy} onRoll={(value) => void run(() => api.roll(value))} />}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {game.canFinish && !confirming && (
            <button type="button" className={game.position === 68 ? "button button--lavender" : "button button--ghost"} onClick={() => setConfirming(true)}>
              Завершить партию
            </button>
          )}
          {confirming && (
            <div className="card stack" role="alertdialog" aria-label="Завершить партию">
              <p>После завершения ходить нельзя. История партии останется в портрете, у гостя — в браузере.</p>
              <div className="row">
                <button type="button" className="button button--lavender" disabled={busy} onClick={() => void finish()}>
                  Завершить партию
                </button>
                <button type="button" className="button button--ghost" onClick={() => setConfirming(false)}>
                  Продолжить партию
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="lila-play__board" hidden={tab !== "board" && tab !== "turn"}>
          <Board current={game.position} trail={trailOf(game)} variant="full" />
          <Board current={game.position} trail={trailOf(game)} variant="compact" />
        </div>
        <div hidden={tab !== "history"}>
          <MoveHistory game={game} />
        </div>
      </div>
    </div>
  );
}
```

Поле в двух вариантах выводится одновременно, лишний скрывается CSS по ширине (Task 11: `.lila-board--full` скрыт на ≤ 720 px, `.lila-board--compact` — на больших). На телефоне вкладка «Поле» показывает поле отдельно, на компьютере оно всегда рядом с ходом.

- [ ] **Step 7: Оболочка страницы**

`apps/web/src/components/lila/GameShell.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { loginHref } from "@/lib/next-path";
import { guestApi, importGuestGame, lilaErrorMessage, serverApi, startServerGame } from "@/lib/lila-api";
import { clearGuestGame, guestStart, guestView, readGuestGame, writeGuestGame, type GuestGame } from "@/lib/lila-guest";
import type { GameView } from "@/lib/lila-view";
import { GamePlay } from "./GamePlay";
import { IntentionForm } from "./IntentionForm";
import { SaveGameBanner } from "./SaveGameBanner";

type Props = { initialGame: GameView | null; signedIn: boolean; images: string[] };

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export function GameShell({ initialGame, signedIn, images }: Props) {
  const [game, setGame] = useState<GameView | null>(initialGame);
  const [guest, setGuest] = useState<GuestGame | null>(null);
  const [ready, setReady] = useState(signedIn && initialGame !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Гостевая партия читается только в браузере; вошедшему она предлагается к переносу
  useEffect(() => {
    const saved = readGuestGame(storage());
    setGuest(saved);
    if (!signedIn && saved) setGame(guestView(saved));
    setReady(true);
  }, [signedIn]);

  async function start(intention: string) {
    setBusy(true);
    setError(null);
    if (!signedIn) {
      const next = guestStart(intention.replace(/\s+/g, " ").trim());
      writeGuestGame(storage(), next);
      setGuest(next);
      setGame(guestView(next));
      reachGoal("lila_start");
      setBusy(false);
      return;
    }
    const result = await startServerGame(intention);
    setBusy(false);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    reachGoal("lila_start");
    setGame(result.game);
  }

  async function save(replace: boolean) {
    if (!guest) return;
    const result = await importGuestGame(guest, replace);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    clearGuestGame(storage());
    setGuest(null);
    setGame(result.game);
    reachGoal("lila_save");
  }

  if (!ready) return <p role="status">Загружаем партию…</p>;

  const active = game && game.status === "active" ? game : null;
  if (!active) {
    return (
      <div className="stack">
        {game && (
          <p role="status" className="lead">
            Партия завершена. История — {signedIn ? "в «Моём портрете»" : "в этом браузере"}.
          </p>
        )}
        {signedIn && guest && !game && <SaveGameBanner guest={guest} onSave={save} onDiscard={() => { clearGuestGame(storage()); setGuest(null); }} />}
        <IntentionForm busy={busy} error={error} onStart={(text) => void start(text)} />
      </div>
    );
  }

  return (
    <div className="stack">
      {signedIn && guest && <SaveGameBanner guest={guest} hasActive onSave={save} onDiscard={() => { clearGuestGame(storage()); setGuest(null); }} />}
      {!signedIn && (
        <p className="muted lila-guest-hint">
          Партия хранится только в этом браузере. <Link href={loginHref(LILA_GAME_PATH)}>Войти и сохранить партию</Link> в «Моём портрете» можно через VK ID.
        </p>
      )}
      <GamePlay key={active.id} initial={active} api={signedIn ? serverApi(active.id) : guestApi(storage())} images={images} onClosed={setGame} />
    </div>
  );
}
```

Компонент `SaveGameBanner` (`SaveGameBanner.tsx`, клиентский): показывает намерение гостевой партии и число ходов; кнопки «Сохранить партию» (`onSave(false)`; если `hasActive` — вместо неё две кнопки «Оставить партию из портрета» → `onDiscard` и «Заменить партией из браузера» → `onSave(true)`) и «Не сохранять» (→ `onDiscard`).

- [ ] **Step 7a: Возврат после входа на `/lila/igra`**

`apps/web/src/lib/next-path.ts`: после входа можно вернуть только на точные внутренние пути, поэтому добавить путь игры:

```ts
import { LILA_GAME_PATH } from "./lila-paths";

export const SAFE_NEXT_PATHS = ["/portret", MATRIX_PATH, LILA_GAME_PATH] as const;
```

В `next-path.test.ts` добавить: `safeNextPath("/lila/igra")` → `"/lila/igra"`; `loginHref("/lila/igra")` → `"/login?next=%2Flila%2Figra"`; внешний адрес и `"/lila/igra/"` с лишним слэшем → `"/portret"`. Run: `pnpm vitest run apps/web/src/lib/next-path.test.ts`.

- [ ] **Step 8: История ходов**

`apps/web/src/components/lila/MoveHistory.tsx` (без состояния; общий для вкладки и страницы истории):

```tsx
import { lilaCellByNumber } from "@oracle/content/lila";
import type { GameView } from "@/lib/lila-view";

export function MoveHistory({ game }: { game: GameView }) {
  if (game.moves.length === 0) return <p className="muted">Ходов пока нет.</p>;
  return (
    <ol className="lila-history">
      {[...game.moves].reverse().map((move) => (
        <li key={move.n} className="lila-history__item">
          <p>
            <strong>Ход {move.n}</strong> · выпало {move.roll}
            {move.customDie && " (свой кубик)"} ·{" "}
            {move.wasted ? "пауза" : move.landed === move.to ? `клетка ${move.to} «${lilaCellByNumber(move.to).name}»` : `${move.transition === "snake" ? "змея" : "стрела"}: ${move.landed} → ${move.to} «${lilaCellByNumber(move.to).name}»`}
          </p>
          {move.note && <p className="muted">Запись: {move.note}</p>}
        </li>
      ))}
    </ol>
  );
}
```

Итог для платной партии добавит план 3б.

- [ ] **Step 9: Страница**

`apps/web/src/app/lila/igra/page.tsx`:

```tsx
import type { Metadata } from "next";
import { GameShell } from "@/components/lila/GameShell";
import { Scene } from "@/components/Scene";
import { getDb } from "@/server/db";
import { defaultRandomRoll } from "@/server/lila-service";
import { activeGame } from "@/server/lila-service";
import { availableCellImages } from "@/server/lila-images";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Играть в Лилу", robots: { index: false, follow: false } };

export default async function LilaGamePage() {
  const user = await currentUser();
  const game = user ? await activeGame({ db: getDb(), randomRoll: defaultRandomRoll, now: () => new Date() }, { userId: user.id }) : null;
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Лила</p>
        <h1 className="display">Ваша партия</h1>
      </div>
      <GameShell initialGame={game} signedIn={user !== null} images={availableCellImages()} />
    </Scene>
  );
}
```

В `PRIVATE_PATHS` (`apps/web/src/lib/seo.ts`) добавить `"/lila/igra"`.

- [ ] **Step 10: Проверка**

Run: `pnpm typecheck && pnpm vitest run apps/web`
Expected: PASS. Вручную: `pnpm dev:db`, `pnpm dev:web`, открыть `http://localhost:3000/lila/igra` — выбрать тему → «Играть» → «Играю со своим кубиком» → 6 → клетка «Рождение» и вопрос; в `localStorage` ключ `lila:game:v1`; перезагрузка страницы — партия на месте.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/components/lila apps/web/src/server/lila-images.ts apps/web/src/app/lila apps/web/src/lib/seo.ts
git commit -m "feat(web): Lila game screen with guest and account play"
```

---

### Task 7: Страница `/lila` и справочник клеток `/lila/kletki/<slug>`

**Files:**
- Create: `apps/web/src/app/lila/page.tsx`
- Create: `apps/web/src/app/lila/kletki/[cell]/page.tsx`
- Modify: `apps/web/src/lib/seo.ts` (PUBLIC_PATHS)
- Test: `apps/web/src/lib/seo.test.ts`

**Interfaces:** Consumes `LILA_CELLS`, `lilaCellFromParam`, `lilaCellPath`, `lilaCellDescription`, `lilaCellJsonLd`, `CellArt`, `Board` (вариант `locator`), `publicMetadata`, `availableCellImages`, `LILA_GAME_PATH`. Produces: публичные страницы, 72 пути в `PUBLIC_PATHS`.

- [ ] **Step 1: Тест путей**

В `apps/web/src/lib/seo.test.ts` добавить:

```ts
test("lists the Lila landing and all 72 cell pages as public paths", () => {
  expect(PUBLIC_PATHS).toContain("/lila");
  expect(PUBLIC_PATHS.filter((path) => path.startsWith("/lila/kletki/"))).toHaveLength(72);
  expect(PUBLIC_PATHS).not.toContain("/lila/igra");
});

test("keeps the game and the portrait out of search", () => {
  expect(PRIVATE_PATHS).toContain("/lila/igra");
});
```

(импорт `PRIVATE_PATHS`, `PUBLIC_PATHS` — как в файле.) Run → FAIL.

- [ ] **Step 2: Пути**

`apps/web/src/lib/seo.ts`:

```ts
import { LILA_CELLS } from "@oracle/content/lila";
import { lilaCellPath, LILA_PATH } from "./lila-paths";
// ...
export const PUBLIC_PATHS: string[] = ["/", MATRIX_PATH, ...ARCANA.map(arcanumPath), LILA_PATH, ...LILA_CELLS.map(lilaCellPath), ...DOCUMENT_PATHS];
```

(`PRIVATE_PATHS` уже дополнен в Task 6.) Run → PASS.

- [ ] **Step 3: Страница клетки**

`apps/web/src/app/lila/kletki/[cell]/page.tsx`:

```tsx
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import { lilaCellByNumber, LILA_CELLS } from "@oracle/content/lila";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Board } from "@/components/lila/Board";
import { CellArt } from "@/components/lila/CellArt";
import { lilaCellDescription, lilaCellFromParam, lilaCellJsonLd, lilaCellPath, lilaParam, LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
import { publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { availableCellImages } from "@/server/lila-images";

type Params = { params: Promise<{ cell: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LILA_CELLS.map((cell) => ({ cell: lilaParam(cell) }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const cell = lilaCellFromParam((await params).cell);
  if (!cell) return {};
  return publicMetadata({
    title: `Клетка ${cell.number} «${cell.name}» в игре Лила — значение`,
    description: lilaCellDescription(cell),
    path: lilaCellPath(cell),
  });
}

const neighbour = (number: number) => lilaCellByNumber(((number - 1 + LILA_CELLS.length) % LILA_CELLS.length) + 1);

export default async function LilaCellPage({ params }: Params) {
  const cell = lilaCellFromParam((await params).cell);
  if (!cell) notFound();
  const snakeTo = LILA_SNAKES[cell.number];
  const arrowTo = LILA_ARROWS[cell.number];
  const target = snakeTo ?? arrowTo;
  const previous = neighbour(cell.number - 1);
  const next = neighbour(cell.number + 1);
  const jsonLd = JSON.stringify(lilaCellJsonLd(cell, SITE_URL)).replace(/</g, "\\u003c");

  return (
    <main className="page page--wide stack lila-cell-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Навигация" className="muted">
        <Link className="touch-link" href={LILA_PATH}>
          Лила
        </Link>{" "}
        › Клетка {cell.number}
      </nav>
      <header className="lila-cell-page__hero">
        <CellArt cell={cell} size="page" available={availableCellImages()} priority />
        <div className="stack">
          <p className="eyebrow eyebrow--line">Клетка {cell.number}</p>
          <h1 className="display">{cell.name}</h1>
          <p className="lead">{cell.about}</p>
        </div>
      </header>

      <section className="card stack" aria-labelledby="questions">
        <h2 id="questions">Вопросы для размышления</h2>
        <ol>
          {cell.questions.map((question, index) => (
            <li key={question}>
              <span className="muted">{index === 0 ? "Первый визит" : index === 1 ? "Второй визит" : "Третий и дальше"}: </span>
              {question}
            </li>
          ))}
        </ol>
      </section>

      {target !== undefined && cell.transition && (
        <section className="card stack" aria-labelledby="transition">
          <h2 id="transition">{snakeTo !== undefined ? "Змея" : "Стрела"}: {cell.number} → {target}</h2>
          <p>{cell.transition}</p>
          <p>
            <Link href={lilaCellPath(lilaCellByNumber(target))}>
              Клетка {target} «{lilaCellByNumber(target).name}»
            </Link>
          </p>
        </section>
      )}

      <Board current={cell.number} variant="locator" />

      <p className="row">
        <Link className="button button--lavender" href={LILA_GAME_PATH}>
          Играть
        </Link>
        <Link className="button button--ghost" href={lilaCellPath(previous)}>
          ← {previous.number} · {previous.name}
        </Link>
        <Link className="button button--ghost" href={lilaCellPath(next)}>
          {next.number} · {next.name} →
        </Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Страница `/lila`**

`apps/web/src/app/lila/page.tsx`:

```tsx
import { LILA_CELLS } from "@oracle/content/lila";
import type { Metadata } from "next";
import Link from "next/link";
import { Board } from "@/components/lila/Board";
import { Scene } from "@/components/Scene";
import { DISCLAIMER } from "@/lib/legal";
import { lilaCellPath, LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Лила онлайн — игра с намерением, поле из 72 клеток",
  description: "Сформулируйте намерение, бросайте кубик и проходите путь по 72 клеткам Лилы: у каждой клетки — тема, вопрос и ваша запись. Бесплатно и без регистрации.",
  path: LILA_PATH,
  absoluteTitle: true,
});

export default function LilaPage() {
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Практика</p>
        <h1 className="display">Лила — игра с вашим намерением</h1>
        <p className="lead">
          Сформулируйте намерение, бросайте кубик и проходите путь по 72 клеткам: у каждой — тема, вопрос и, при желании, ваша запись. Это способ посмотреть на свой вопрос по-новому, а не предсказание.
        </p>
        <p>
          <Link className="button button--lavender" href={LILA_GAME_PATH}>
            Играть
          </Link>
        </p>
        <p className="muted">Без регистрации · партия сохраняется в вашем браузере</p>
      </div>

      <section className="card stack" aria-labelledby="how">
        <h2 id="how">Как играть</h2>
        <ol>
          <li>Выберите намерение — один личный вопрос, к которому вы готовы возвращаться.</li>
          <li>Бросайте кубик. Чтобы начать, нужна шестёрка.</li>
          <li>На каждой клетке — короткий текст и вопрос для размышления. Записать мысль можно, но не обязательно.</li>
          <li>Стрелы поднимают на другую клетку, змеи возвращают к теме, которая просит внимания. Цель пути — клетка 68, попасть на неё можно только точным броском.</li>
        </ol>
      </section>

      <section className="stack" aria-labelledby="field">
        <h2 id="field">Поле Лилы</h2>
        <Board current={1} variant="full" />
        <Board current={1} variant="compact" />
      </section>

      <section className="stack" aria-labelledby="cells">
        <h2 id="cells">72 клетки</h2>
        <ul className="lila-cell-grid">
          {LILA_CELLS.map((cell) => (
            <li key={cell.number}>
              <Link className="touch-link" href={lilaCellPath(cell)}>
                {cell.number} · {cell.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted">{DISCLAIMER}</p>
    </Scene>
  );
}
```

- [ ] **Step 5: Проверка и коммит**

Run: `pnpm vitest run apps/web/src/lib/seo.test.ts && pnpm --filter @oracle/web typecheck && pnpm --filter @oracle/web build`
Expected: PASS; сборка генерирует 72 страницы `/lila/kletki/*`. (Сборка требует переменных окружения `.env.development.local`, как для остальных страниц.)

```bash
git add apps/web/src/app/lila apps/web/src/lib/seo.ts apps/web/src/lib/seo.test.ts
git commit -m "feat(web): Lila landing and 72 cell reference pages"
```

---

### Task 8: Портрет и главная — «Мои партии», история партии, открытая практика

**Files:**
- Create: `apps/web/src/app/portret/lila/[id]/page.tsx`
- Modify: `apps/web/src/app/portret/page.tsx`, `apps/web/src/lib/practices.ts`, `apps/web/src/lib/practices.test.ts`, `apps/web/src/lib/analytics.ts`
- Modify (по результату проверки): `e2e/launch.spec.ts`, `e2e/portrait.spec.ts`

**Interfaces:** Consumes `listLilaGames`, `getLilaGame`, `toGameView`, `MoveHistory`, `Board`, `trailOf`, `lilaHistoryPath`, `LILA_PATH`. Produces: карточка «Мои партии», страница `/portret/lila/[id]`, цели Метрики `lila_start`, `lila_finish`, `lila_save`.

- [ ] **Step 1: Практика открыта**

`apps/web/src/lib/practices.ts`: `import { LILA_PATH } from "./lila-paths";` и `href: LILA_PATH` у практики `lila`; текст — оставить.
`practices.test.ts` — заменить ожидание: `["lila", "/lila"]` и переименовать тест в «only the matrix and Lila are open for now».

Run: `grep -rn "Скоро" apps/web/src e2e --include=*.ts --include=*.tsx | grep -iv "tarot\|natal"` — найти, где явно проверяется, что «Лила» закрыта (`e2e/launch.spec.ts`, тексты главной), и привести ожидания к новому состоянию: метка «Открыто» у Лилы, «Скоро» — у Таро и натальной карты.

- [ ] **Step 2: Цели Метрики**

`apps/web/src/lib/analytics.ts` — в `GOALS` добавить `"lila_start"`, `"lila_finish"`, `"lila_save"` (комментарий: «план 3а: Лила»). `analytics.test.ts` — если проверяется список целей, обновить.

- [ ] **Step 3: Страница истории партии**

`apps/web/src/app/portret/lila/[id]/page.tsx`:

```tsx
import { getLilaGame } from "@oracle/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Board } from "@/components/lila/Board";
import { MoveHistory } from "@/components/lila/MoveHistory";
import { Scene } from "@/components/Scene";
import { DISCLAIMER } from "@/lib/legal";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { trailOf } from "@/lib/lila-turn";
import { toGameView } from "@/lib/lila-view";
import { getDb } from "@/server/db";
import { requireUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Партия Лилы", robots: { index: false, follow: false } };

export default async function LilaHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const record = await getLilaGame(getDb(), (await params).id);
  // Чужая и несуществующая партия неотличимы; ожидающая оплаты и брошенная историей не считаются
  if (!record || record.userId !== user.id || (record.status !== "active" && record.status !== "finished")) notFound();
  const game = toGameView(record);
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Партия Лилы</p>
        <h1 className="display">{game.intention}</h1>
        <p className="muted">
          Ходов {game.movesCount} · {game.status === "active" ? "партия идёт" : "партия завершена"}
        </p>
        {game.status === "active" && (
          <p>
            <Link className="button button--lavender" href={LILA_GAME_PATH}>
              Продолжить партию
            </Link>
          </p>
        )}
      </div>
      <Board current={game.position} trail={trailOf(game)} variant="full" />
      <Board current={game.position} trail={trailOf(game)} variant="compact" />
      <section className="card stack" aria-labelledby="moves">
        <h2 id="moves">Ходы</h2>
        <MoveHistory game={game} />
      </section>
      <p className="muted">{DISCLAIMER}</p>
    </Scene>
  );
}
```

- [ ] **Step 4: Карточка «Мои партии»**

В `apps/web/src/app/portret/page.tsx`: импорты `listLilaGames` (из `@oracle/db`), `lilaHistoryPath`, `LILA_GAME_PATH`; после `const reports = …`:

```tsx
  const games = await listLilaGames(getDb(), user.id);
```

и после секции «Разборы»:

```tsx
      {games.length > 0 && (
        <section className="card stack portrait-reports" aria-labelledby="games">
          <h2 id="games">Мои партии</h2>
          <ul className="portrait-reports__list">
            {games.map((game) => (
              <li key={game.id}>
                <span>
                  {game.status === "active" ? "Идёт" : "Завершена"} · «{game.intention}» · ход {game.movesCount}
                </span>
                <Link className="button button--ghost" href={game.status === "active" ? LILA_GAME_PATH : lilaHistoryPath(game.id)}>
                  {game.status === "active" ? "Продолжить партию" : "Открыть партию"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
```

- [ ] **Step 5: Проверка и коммит**

Run: `pnpm vitest run apps/web/src/lib && pnpm typecheck`
Expected: PASS.

```bash
git add apps/web/src apps/web/../../e2e
git commit -m "feat(web): open Lila in practices, portrait games and history page"
```

---

### Task 9: Политика, тексты AGENTS.md и документы

**Files:**
- Modify: `apps/web/src/lib/legal.ts`, `apps/web/src/lib/legal.test.ts`, `apps/web/src/app/privacy/page.tsx`
- Modify: `AGENTS.md`

- [ ] **Step 1: Что меняется в политике**

Для вошедшего пользователя намерение и записи мыслей хранятся на сервере, поэтому политика обязана это назвать. Бесплатная игра гостя данных на сервер не отправляет. Правки в `privacy/page.tsx`:
- §2 «Какие данные обрабатываются» — добавить пункт: «тексты намерений и записей мыслей, которые вы оставляете в партиях Лилы, и ходы партии (только если вы вошли и играете после входа); гостевая партия хранится только в вашем браузере».
- §3 «Зачем» — «сохранение и продолжение партий Лилы».
- §7 «Сроки» — «партии и записи хранятся, пока вы не удалите данные; кнопка «Удалить мои данные» удаляет их вместе с ходами».
Формулировки вписать в стиле соседних пунктов страницы (прочитать страницу целиком перед правкой).

- [ ] **Step 2: Версия и дата**

`apps/web/src/lib/legal.ts`: `LEGAL_VERSIONS.privacy` → `"2026-10-v1"`, `LEGAL_DATES.privacy` → дата PR (в формате «N октября 2026 года»). Проверить `legal.test.ts`: тест, что текст согласия при входе не меняется (`LOGIN_CONSENT_RECIPIENTS`), остаётся зелёным; если есть проверка версии — обновить.

- [ ] **Step 3: AGENTS.md**

В таблицу «Где что лежит» добавить строки:

| Что | Файл |
|---|---|
| Лила: вход и справочник | `apps/web/src/app/lila/page.tsx` |
| Лила: игра | `apps/web/src/app/lila/igra/`, `apps/web/src/components/lila/` |
| Лила: страницы клеток | `apps/web/src/app/lila/kletki/[cell]/page.tsx` |
| Лила: история партии | `apps/web/src/app/portret/lila/[id]/page.tsx` |
| Тексты клеток | `packages/content/lila-cells.md` (после правки — `pnpm content:build`) |
| Иллюстрации клеток | `apps/web/public/lila/NN-slug.webp` (960), `NN-slug-480.webp` (карточка хода), `NN-slug-160.webp` (сетка); путь даёт `lilaCellImage` в `apps/web/src/lib/lila-paths.ts`; пока файла нет — запасная карточка `CellFallback` |

В «Должно остаться на месте» добавить: «**Лила — тексты дословно:** «Играть», «Бросить кубик», «Играю со своим кубиком», «Сохранить партию», «Продолжить партию», «Завершить партию», «Играть без проводника», «Войти и сохранить партию», метка «Открыто клеток»; на странице клетки — заголовки «Вопросы для размышления», «Змея»/«Стрела»; на `/lila` и `/lila/igra` ровно один `<h1>`; статусы хода — `role="status"`, ошибки — `role="alert"`; партия и намерение гостя не уходят на сервер».

- [ ] **Step 4: Проверка и коммит**

Run: `pnpm vitest run apps/web/src/lib/legal.test.ts && pnpm typecheck`

```bash
git add AGENTS.md apps/web/src/lib/legal.ts apps/web/src/lib/legal.test.ts apps/web/src/app/privacy/page.tsx
git commit -m "docs: privacy policy and agent rules for Lila"
```

---

### Task 10: Сквозные тесты `e2e/lila.spec.ts`

**Files:**
- Create: `e2e/lila.spec.ts`

Тесты используют «свой кубик», чтобы путь был детерминированным: 6 (вход на 1) → 5 (клетка 6) → 6 (клетка 12, змея на 8). Нужны `dev:db`, `dev:web`, `DEV_LOGIN=1` (`pnpm test:e2e`).

- [ ] **Step 1: Тесты**

```ts
import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

const INTENTION = "Почему мне трудно принять решение о работе?";

async function start(page: Page) {
  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Или напишите своё намерение" }).fill(INTENTION);
  await page.getByRole("button", { name: "Играть", exact: true }).click();
  await expect(page.getByText(`Намерение: ${INTENTION}`)).toBeVisible();
}

async function ownRoll(page: Page, value: number) {
  const group = page.getByRole("group", { name: "Что выпало на вашем кубике" });
  if (!(await group.isVisible())) await page.getByRole("button", { name: "Играю со своим кубиком" }).click();
  await group.getByRole("button", { name: `Выпало ${value}` }).click();
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("the landing lists 72 cells and links to a cell page", async ({ page }) => {
  await page.goto("/lila");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Лила — игра с вашим намерением");
  await expect(page.getByRole("region", { name: "72 клетки" }).getByRole("link")).toHaveCount(72);
  await page.getByRole("link", { name: "12 · Зависть" }).click();
  await expect(page).toHaveURL("/lila/kletki/12-zavist");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Зависть");
  await expect(page.getByRole("heading", { level: 2, name: /Змея: 12 → 8/ })).toBeVisible();
  expect((await page.goto("/lila/kletki/12-alchnost"))?.status()).toBe(404);
  await noHorizontalScroll(page);
});

test("a guest plays: waits for a six, meets a snake, keeps the game after a reload", async ({ page }) => {
  await start(page);
  await ownRoll(page, 3);
  await expect(page.getByRole("heading", { level: 2, name: "Пауза" })).toBeVisible();
  await ownRoll(page, 6);
  await expect(page.getByRole("heading", { level: 2, name: "Рождение" })).toBeVisible();
  await ownRoll(page, 5);
  await ownRoll(page, 6);
  await expect(page.getByText("Клетка 12 ·")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Алчность" })).toBeVisible();
  await expect(page.getByText(/Открыто клеток: 4 из 72/)).toBeVisible();
  await noHorizontalScroll(page);

  await expect(page.getByRole("link", { name: "Войти и сохранить партию" })).toHaveAttribute("href", "/login?next=%2Flila%2Figra");

  await page.reload();
  await expect(page.getByText(`Намерение: ${INTENTION}`)).toBeVisible();
  await expect(page.getByText(/Ходов 4/)).toBeVisible();
});

test("a guest game is saved to the portrait after login and shows in «Мои партии»", async ({ page, context }) => {
  await start(page);
  await ownRoll(page, 6);
  await page.goto(`/api/dev/login?name=${encodeURIComponent(uniqueName("Партия"))}`);
  await expect(page).toHaveURL(/\/portret$/);

  await page.goto("/lila/igra");
  await page.getByRole("button", { name: "Сохранить партию" }).click();
  await expect(page.getByText(`Намерение: ${INTENTION}`)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Ходов 1/)).toBeVisible();

  await page.goto("/portret");
  await expect(page.getByRole("region", { name: "Мои партии" })).toContainText(INTENTION);
  await context.close();
});

test("another user cannot open a saved game, and deleting data removes it", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Владелица"));
  await start(page);
  await ownRoll(page, 6);
  await page.goto("/portret");
  await page.getByRole("link", { name: "Продолжить партию" }).click();
  await expect(page).toHaveURL(/\/lila\/igra$/);

  const gameId = await page.evaluate(async () => {
    const response = await fetch("/api/lila/games/active");
    return ((await response.json()) as { game: { id: string } }).game.id;
  });
  const { context: strangerContext, page: stranger } = await signIn(browser, uniqueName("Чужой"));
  expect((await stranger.goto(`/portret/lila/${gameId}`))?.status()).toBe(404);
  expect((await stranger.request.post(`/api/lila/games/${gameId}/roll`, { data: {} })).status()).toBe(404);
  await strangerContext.close();

  await page.goto("/portret/delete");
  await page.getByRole("button", { name: "Удалить навсегда" }).click();
  await context.close();
});

test("the game page is not indexed and the cell pages are in the sitemap", async ({ page, request }) => {
  await page.goto("/lila/igra");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/lila/kletki/12-zavist");
  expect(sitemap).not.toContain("/lila/igra");
});
```

- [ ] **Step 2: Запустить**

Run: `pnpm test:e2e -g "lila|Лила|guest|landing|another user|game page"` (или весь `pnpm test:e2e`; нужны запущенные `dev:db` и `dev:web`).
Expected: PASS. Если тест «Удалить навсегда» требует подтверждения по образцу `portrait.spec.ts` — повторить порядок действий оттуда.

- [ ] **Step 3: Commit**

```bash
git add e2e/lila.spec.ts
git commit -m "test(e2e): Lila landing, guest game, save to portrait, access and sitemap"
```

---

### Task 11: Встраивание макетов Codex и проверка (после готовых макетов)

**Files:**
- Modify: `apps/web/src/app/globals.css`, компоненты `apps/web/src/components/lila/*`, страницы `apps/web/src/app/lila/**`
- Create: `apps/web/public/lila/*.webp` (по мере готовности)

Выполняется, когда владелица положила макеты в `docs/design/mockups/lila-*-1440.webp` и `…-375.webp` (бриф — `docs/design/codex-brief-lila.md`).

- [ ] **Step 1: Прочитать макеты**

Посмотреть все `lila-*` макеты; сверить состав и состояния с `docs/design/wireframes/lila.html` (экраны 1–7). Расхождения по составу — вопрос владелице, не самодеятельность.

- [ ] **Step 2: Стили**

Добавить в `globals.css` стили классов `lila-*` из компонентов (только переменные `:root`, новые цвета — переменными): раскладка `lila-play__layout` (две колонки от 1024 px, вкладки на телефоне), переключение `.lila-board--full` / `.lila-board--compact` по ширине, `lila-turn`, `lila-dice`, `lila-history`, `lila-cell-grid`, `lila-fallback` (оттенок по `row-0…row-7`), `lila-tabs`, кнопка броска закреплена внизу на телефоне; анимации фишки и кубика — только в `@media (prefers-reduced-motion: no-preference)`.

- [ ] **Step 3: Иллюстрации**

Переносить файлы из `docs/design/mockups/` в `apps/web/public/lila/` пачками по `NN-slug.webp`, `NN-slug-480.webp`, `NN-slug-160.webp`. Когда добавлены все 72×3, установить `LILA_IMAGES_READY = true` в `apps/web/src/lib/lila-paths.ts`.

- [ ] **Step 4: Проверка в браузере**

`pnpm dev:db`, `pnpm dev:web`; ширина 375 px и 1440 px: `/lila`, `/lila/igra` (все состояния: пауза, вход, обычный ход, змея, стрела, повторный визит, цель, ошибка), `/lila/kletki/12-zavist`, `/portret` с партией, `/portret/lila/<id>`. Убедиться: нет горизонтальной прокрутки, текст ≥ 14 px (тексты клеток и вопросы — 16 px), зоны нажатия ≥ 44 px, видимый фокус, контраст AA, движение отключается при `prefers-reduced-motion`.

- [ ] **Step 5: Полная проверка и коммит**

Run: `pnpm install && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: всё зелёное.

```bash
git add apps/web docs/design
git commit -m "style(web): embed Lila visuals"
```

---

### Task 12: Сдача

- [ ] **Step 1: Готовность к PR**

- Тексты 72 клеток вычитаны владелицей (файл `packages/content/lila-cells.md`), правки внесены, `pnpm content:build` выполнен, JSON закоммичен.
- `pnpm typecheck`, `pnpm test`, покрытие `pnpm test:coverage` ≥ 80 %, `pnpm test:e2e` зелёные.
- Проверка сборки: `pnpm --filter @oracle/web build` создаёт 72 страницы клеток.

- [ ] **Step 2: Pull request**

Ветка `feat/lila-free` → PR в `master`; описание — что входит (бесплатная игра, справочник, портрет), что не входит (платная сессия — план 3б), инструкция проверки для владелицы (гость: сыграть партию; вход: «Сохранить партию»; страницы клеток; портрет). Мерж — только по «да» владелицы; после мержа сайт выкладывается автоматически.

- [ ] **Step 3: После выкладки — владелица**

Проверить `https://tvoy-orakul.ru/lila`, `/lila/kletki/12-zavist`, `/sitemap.xml`; добавить новые страницы в Яндекс.Вебмастер (переобход). Действий на сервере не требуется: новых переменных окружения и контейнеров в 3а нет.

---

## Self-review плана 3а

- **Покрытие спецификации:** правила и движок — Task 1; тексты клетки (описание, три вопроса, 20 переходов) — Task 2; данные и удаление данных, одна активная партия, лимит 120, завершение — Task 3; бросок на сервере, перенос гостевой партии, доступ — Task 4; гостевая партия в браузере, «свой кубик», повторные посещения — Task 5–6; `/lila`, `/lila/igra`, `/lila/kletki/<slug>`, `/portret/lila/[id]`, карточка портрета и главной — Task 6–8; иллюстрации не блокируют — Task 5–7 (`CellFallback`, `availableCellImages`, `LILA_IMAGES_READY`); политика — Task 9; цели Метрики (`lila_start`, `lila_finish`, `lila_save`) — Task 6, 8; тесты — в каждой задаче и Task 10. Платное (проводник, итог, оплата, `PAID_LILA`, PDF, оферта) — план 3б.
- **Отклонения от спецификации:** тексты клеток — один файл `lila-cells.md` вместо 72 (как `positions.md`; вычитывать проще); `lila_offer_click` и `lila_paid` уйдут в 3б.
- **Не проверено при написании:** точные ожидания `e2e/launch.spec.ts` и главной страницы о метке «Скоро» у Лилы (Task 8 Step 1 требует найти и обновить); формулировки политики (Task 9 Step 1 требует прочитать страницу перед правкой).
