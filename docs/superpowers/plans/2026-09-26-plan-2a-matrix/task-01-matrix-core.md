# Задача 1 — расчёт матрицы в `packages/core`

**Files:**
- Create: `packages/core/src/matrix.ts`
- Create: `packages/core/src/matrix.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `type BirthDate = { year; month; day }` из `packages/core/src/birth-date.ts`.
- Produces:
  - `ARCANA_COUNT = 22`
  - `reduceToArcanum(n: number): number` — целое `n ≥ 1` → 1…22; иначе `RangeError`
  - `MATRIX_POINTS` — кортеж имён точек (порядок ниже), `type MatrixPoint = (typeof MATRIX_POINTS)[number]`
  - `type Matrix = Readonly<Record<MatrixPoint, number>>`
  - `calculateMatrix(date: BirthDate): Matrix`

## Зачем

Спецификация 2а, раздел 2. Одна чистая функция считает все точки; её используют калькулятор (в браузере), страницы портрета и тесты. Формулы — схема Натальи Ладини; значения для примеров посчитаны заранее и зафиксированы в тесте.

Имена точек:
- основной квадрат `A` (день, слева), `B` (месяц, сверху), `C` (год, справа), `D` (снизу), `E` (центр);
- родовой квадрат `F` (A+B, слева сверху), `G` (B+C, справа сверху), `H` (C+D, справа снизу), `I` (D+A, слева снизу);
- внутренние точки: `X2 = X + E` (ближе к центру), `X1 = X + X2` (ближе к внешней точке) для X ∈ {A…I};
- линия отношений и денег: `heart = C2 + D2`, `love = heart + D2`, `money = heart + C2`;
- предназначения: `sky = B + D`, `earth = A + C`, `personal = sky + earth`, `male = F + H`, `female = G + I`, `social = male + female`, `spiritual = personal + social`, `planetary = social + spiritual`.

Каждая сумма сворачивается `reduceToArcanum`.

## Шаги

- [ ] **Step 1: Написать падающий тест**

`packages/core/src/matrix.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { calculateMatrix, MATRIX_POINTS, reduceToArcanum } from "./matrix";

describe("reduceToArcanum", () => {
  test("keeps numbers from 1 to 22 as they are", () => {
    expect(reduceToArcanum(1)).toBe(1);
    expect(reduceToArcanum(22)).toBe(22);
  });

  test("sums digits until the number fits into 22", () => {
    expect(reduceToArcanum(23)).toBe(5);
    expect(reduceToArcanum(29)).toBe(11);
    expect(reduceToArcanum(1988)).toBe(8); // 1988 → 26 → 8
    expect(reduceToArcanum(99)).toBe(18);
  });

  test("rejects zero, negatives and fractions", () => {
    expect(() => reduceToArcanum(0)).toThrow(RangeError);
    expect(() => reduceToArcanum(-5)).toThrow(RangeError);
    expect(() => reduceToArcanum(2.5)).toThrow(RangeError);
  });
});

// Значения посчитаны по формулам спецификации 2а (раздел 2). Перед коммитом сверить A–E, F–I и личное/социальное/духовное
// предназначения для 1988-11-18 и 1990-05-14 с двумя-тремя популярными онлайн-калькуляторами матрицы (Step 5a)
const KNOWN = {
  "1988-11-18": { A: 18, B: 11, C: 8, D: 10, E: 11, F: 11, G: 19, H: 18, I: 10, A1: 11, A2: 11, B1: 6, B2: 22, C1: 9, C2: 19, D1: 4, D2: 21, F1: 6, F2: 22, G1: 22, G2: 3, H1: 11, H2: 11, I1: 4, I2: 21, heart: 4, love: 7, money: 5, sky: 21, earth: 8, personal: 11, male: 11, female: 11, social: 22, spiritual: 6, planetary: 10 },
  "1990-05-14": { A: 14, B: 5, C: 19, D: 11, E: 13, F: 19, G: 6, H: 3, I: 7, A1: 5, A2: 9, B1: 5, B2: 18, C1: 6, C2: 5, D1: 17, D2: 6, F1: 6, F2: 5, G1: 7, G2: 19, H1: 19, H2: 16, I1: 9, I2: 20, heart: 11, love: 17, money: 16, sky: 16, earth: 6, personal: 22, male: 22, female: 13, social: 8, spiritual: 3, planetary: 11 },
  "2000-02-29": { A: 11, B: 2, C: 2, D: 15, E: 3, F: 13, G: 4, H: 17, I: 8, A1: 7, A2: 14, B1: 7, B2: 5, C1: 7, C2: 5, D1: 6, D2: 18, F1: 11, F2: 16, G1: 11, G2: 7, H1: 10, H2: 20, I1: 19, I2: 11, heart: 5, love: 5, money: 10, sky: 17, earth: 13, personal: 3, male: 3, female: 12, social: 15, spiritual: 18, planetary: 6 },
  "1900-01-01": { A: 1, B: 1, C: 10, D: 12, E: 6, F: 2, G: 11, H: 22, I: 13, A1: 8, A2: 7, B1: 8, B2: 7, C1: 8, C2: 16, D1: 3, D2: 18, F1: 10, F2: 8, G1: 10, G2: 17, H1: 5, H2: 10, I1: 5, I2: 19, heart: 7, love: 7, money: 5, sky: 13, earth: 11, personal: 6, male: 6, female: 6, social: 12, spiritual: 18, planetary: 3 },
  "1999-12-31": { A: 4, B: 12, C: 10, D: 8, E: 7, F: 16, G: 22, H: 18, I: 12, A1: 15, A2: 11, B1: 4, B2: 19, C1: 9, C2: 17, D1: 5, D2: 15, F1: 21, F2: 5, G1: 6, G2: 11, H1: 7, H2: 7, I1: 4, I2: 19, heart: 5, love: 20, money: 22, sky: 20, earth: 14, personal: 7, male: 7, female: 7, social: 14, spiritual: 21, planetary: 8 },
  "1977-07-23": { A: 5, B: 7, C: 6, D: 18, E: 9, F: 12, G: 13, H: 6, I: 5, A1: 19, A2: 14, B1: 5, B2: 16, C1: 21, C2: 15, D1: 9, D2: 9, F1: 6, F2: 21, G1: 8, G2: 22, H1: 21, H2: 15, I1: 19, I2: 14, heart: 6, love: 15, money: 21, sky: 7, earth: 11, personal: 18, male: 18, female: 18, social: 9, spiritual: 9, planetary: 18 },
} as const;

const toDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  return { year, month, day };
};

describe("calculateMatrix", () => {
  test.each(Object.entries(KNOWN))("computes every point for %s", (iso, expected) => {
    expect(calculateMatrix(toDate(iso))).toEqual(expected);
  });

  test("returns exactly the documented points", () => {
    expect(Object.keys(calculateMatrix(toDate("1988-11-18"))).sort()).toEqual([...MATRIX_POINTS].sort());
  });

  test("keeps every point within 1–22 for every date from 1900 to 2030", () => {
    const outOfRange: string[] = [];
    for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2030, 11, 31); t += 86_400_000) {
      const d = new Date(t);
      const matrix = calculateMatrix({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
      for (const point of MATRIX_POINTS) {
        const value = matrix[point];
        if (!Number.isInteger(value) || value < 1 || value > 22) outOfRange.push(`${d.toISOString().slice(0, 10)} ${point}=${value}`);
      }
    }
    expect(outOfRange).toEqual([]);
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `pnpm vitest run --project core packages/core/src/matrix.test.ts`
Expected: FAIL — `Failed to resolve import "./matrix"`.

- [ ] **Step 3: Реализация**

`packages/core/src/matrix.ts`:

```ts
import type { BirthDate } from "./birth-date";

export const ARCANA_COUNT = 22;

// Порядок: основной квадрат, родовой квадрат, внутренние точки, линия отношений и денег, предназначения
export const MATRIX_POINTS = [
  "A", "B", "C", "D", "E",
  "F", "G", "H", "I",
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2",
  "F1", "F2", "G1", "G2", "H1", "H2", "I1", "I2",
  "heart", "love", "money",
  "sky", "earth", "personal", "male", "female", "social", "spiritual", "planetary",
] as const;

export type MatrixPoint = (typeof MATRIX_POINTS)[number];
export type Matrix = Readonly<Record<MatrixPoint, number>>;

const digitSum = (n: number): number => [...String(n)].reduce((sum, digit) => sum + Number(digit), 0);

// Свёртка к номеру аркана: пока больше 22 — складываем цифры (29 → 11, 1988 → 26 → 8)
export function reduceToArcanum(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`reduceToArcanum expects a positive integer, got ${n}`);
  let value = n;
  while (value > ARCANA_COUNT) value = digitSum(value);
  return value;
}

const add = (...values: number[]): number => reduceToArcanum(values.reduce((sum, value) => sum + value, 0));

export function calculateMatrix(date: BirthDate): Matrix {
  const A = reduceToArcanum(date.day);
  const B = reduceToArcanum(date.month);
  const C = reduceToArcanum(digitSum(date.year));
  const D = add(A, B, C);
  const E = add(A, B, C, D);
  const F = add(A, B);
  const G = add(B, C);
  const H = add(C, D);
  const I = add(D, A);

  // Внутренние точки на линии «вершина → центр»: X2 ближе к центру, X1 ближе к вершине
  const inner = (x: number) => add(x, E);
  const A2 = inner(A), B2 = inner(B), C2 = inner(C), D2 = inner(D);
  const F2 = inner(F), G2 = inner(G), H2 = inner(H), I2 = inner(I);

  const heart = add(C2, D2);
  const sky = add(B, D);
  const earth = add(A, C);
  const personal = add(sky, earth);
  const male = add(F, H);
  const female = add(G, I);
  const social = add(male, female);
  const spiritual = add(personal, social);

  return {
    A, B, C, D, E, F, G, H, I,
    A1: add(A, A2), A2, B1: add(B, B2), B2, C1: add(C, C2), C2, D1: add(D, D2), D2,
    F1: add(F, F2), F2, G1: add(G, G2), G2, H1: add(H, H2), H2, I1: add(I, I2), I2,
    heart, love: add(heart, D2), money: add(heart, C2),
    sky, earth, personal, male, female, social, spiritual, planetary: add(social, spiritual),
  };
}
```

`packages/core/src/index.ts`:

```ts
export * from "./birth-date";
export * from "./matrix";
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm vitest run --project core`
Expected: PASS (все тесты `core`, включая старые).

- [ ] **Step 5: Покрытие 100 %**

Run: `pnpm vitest run --project core --coverage --coverage.include=packages/core/src/matrix.ts`
Expected: `matrix.ts` — 100 % по строкам, ветвям, функциям.

- [ ] **Step 5a: Сверка с внешними калькуляторами**

Открыть 2–3 популярных калькулятора «матрица судьбы по дате рождения» (выдача Яндекса по этому запросу), ввести 18.11.1988 и 14.05.1990 и сравнить A, B, C, D, E, F, G, H, I и личное/социальное/духовное предназначение с таблицей `KNOWN`. Калькуляторы расходятся в обозначениях внутренних точек — их не сверять. Если наша таблица расходится с большинством по основным точкам — остановиться и написать контроллеру, какие точки и как (формулы спецификации меняются только с согласия владелицы). Если сверить нельзя (нет доступа к сайтам) — отметить это в отчёте задачи.

- [ ] **Step 6: Коммит**

```bash
git add packages/core/src/matrix.ts packages/core/src/matrix.test.ts packages/core/src/index.ts
git commit -m "feat(core): destiny matrix calculation with reference dates"
```
