# Задача 7 — результат матрицы: логика отображения, диаграмма, карточки

**Files:**
- Create: `apps/web/src/lib/matrix-view.ts`; Test: `apps/web/src/lib/matrix-view.test.ts`
- Create: `apps/web/src/components/matrix/MatrixDiagram.tsx`, `apps/web/src/components/matrix/MatrixResult.tsx`
- Modify: `apps/web/src/app/globals.css` (блок «Результат матрицы», класс `.visually-hidden`)

**Interfaces:**
- Consumes: `type Matrix`, `type MatrixPoint`, `MATRIX_POINTS` (задача 1); `arcanumByNumber`, `type Arcanum` (задачи 2–3); `arcanumPath` (задача 6).
- Produces:
  - `KEY_POINTS` — `[{ point: "A", key: "personality", label: "Личность" }, { point: "E", key: "center", label: "Центр" }, { point: "D", key: "task", label: "Задача" }]`
  - `PURPOSES` — `[{ point: "personal", label: "Личное" }, { point: "social", label: "Социальное" }, { point: "spiritual", label: "Духовное" }]`
  - `POINT_LABELS: Record<MatrixPoint, string>`
  - `type DiagramPoint = { point: MatrixPoint; x: number; y: number; r: number; tier: "key" | "main" | "family" | "inner" | "line" }`, `DIAGRAM_SIZE = 400`, `DIAGRAM_POINTS: readonly DiagramPoint[]`, `DIAGRAM_LINES: readonly (readonly [MatrixPoint, MatrixPoint])[]`
  - `pointTitle(point: MatrixPoint, value: number): string`, `pointRows(matrix: Matrix): { point: MatrixPoint; label: string; value: number; name: string }[]`
  - `<MatrixDiagram matrix />`
  - `<MatrixResult matrix dateLabel headingRef? actions? />` — секция результата: диаграмма, три ключевые карточки, «Действие на сегодня», «Вопрос для себя», предназначения, слот `actions` (сохранение и «Поделиться» — задача 8), анонс Лилы

## Зачем

Спецификация 2а, раздел 4, каркас `docs/design/wireframes/matrix.html` (экран 2). Всё, что можно проверить без браузера, — координаты точек, подписи, выбор текстов — лежит в `matrix-view.ts` и покрыто тестами. Компоненты только рисуют. Результат выглядит законченным: без замков, размытия и «читать дальше». Платного блока нет.

Координаты — на поле 400×400: основной квадрат (A слева, B сверху, C справа, D снизу, E в центре), родовой квадрат по углам, внутренние точки на линиях к центру, короткая линия отношений и денег справа снизу. Тест проверяет, что ни один кружок не налезает на другой и не выходит за поле.

## Шаги

- [ ] **Step 1: Падающие тесты**

`apps/web/src/lib/matrix-view.test.ts`:

```ts
import { calculateMatrix, MATRIX_POINTS } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { DIAGRAM_LINES, DIAGRAM_POINTS, DIAGRAM_SIZE, KEY_POINTS, POINT_LABELS, pointRows, pointTitle, PURPOSES } from "./matrix-view";

const PURPOSE_POINTS = ["sky", "earth", "personal", "male", "female", "social", "spiritual", "planetary"];

describe("diagram layout", () => {
  test("draws every point except the purposes, each once", () => {
    const drawn = DIAGRAM_POINTS.map((p) => p.point).sort();
    const expected = MATRIX_POINTS.filter((p) => !PURPOSE_POINTS.includes(p)).sort();
    expect(drawn).toEqual(expected);
  });

  test("keeps every circle inside the field", () => {
    for (const { point, x, y, r } of DIAGRAM_POINTS) {
      expect({ point, inside: x - r >= 0 && y - r >= 0 && x + r <= DIAGRAM_SIZE && y + r <= DIAGRAM_SIZE }).toEqual({ point, inside: true });
    }
  });

  test("no two circles overlap", () => {
    const overlaps: string[] = [];
    DIAGRAM_POINTS.forEach((a, i) => {
      DIAGRAM_POINTS.slice(i + 1).forEach((b) => {
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) overlaps.push(`${a.point}/${b.point}`);
      });
    });
    expect(overlaps).toEqual([]);
  });

  test("highlights exactly the three key points", () => {
    expect(DIAGRAM_POINTS.filter((p) => p.tier === "key").map((p) => p.point).sort()).toEqual(["A", "D", "E"]);
  });

  test("lines connect drawn points only", () => {
    const drawn = new Set(DIAGRAM_POINTS.map((p) => p.point));
    for (const [from, to] of DIAGRAM_LINES) {
      expect(drawn.has(from) && drawn.has(to)).toBe(true);
    }
  });
});

describe("labels", () => {
  test("every point has a label, and the key points and purposes are the agreed ones", () => {
    expect(MATRIX_POINTS.every((p) => POINT_LABELS[p].length > 0)).toBe(true);
    expect(KEY_POINTS.map((k) => [k.point, k.label])).toEqual([["A", "Личность"], ["E", "Центр"], ["D", "Задача"]]);
    expect(PURPOSES.map((p) => p.point)).toEqual(["personal", "social", "spiritual"]);
  });

  test("a point title names the position, the number and the arcanum", () => {
    expect(pointTitle("E", 11)).toBe("E — центр: 11, Сила");
  });

  test("rows list every point with its arcanum name for screen readers", () => {
    const rows = pointRows(calculateMatrix({ year: 1988, month: 11, day: 18 }));
    expect(rows).toHaveLength(MATRIX_POINTS.length);
    expect(rows[0]).toEqual({ point: "A", label: "A — личность", value: 18, name: "Луна" });
  });
});
```

Run: `pnpm vitest run --project web apps/web/src/lib/matrix-view.test.ts` — Expected: FAIL (модуля нет).

- [ ] **Step 2: Логика отображения**

`apps/web/src/lib/matrix-view.ts`:

```ts
import { MATRIX_POINTS, type Matrix, type MatrixPoint } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";

export const KEY_POINTS = [
  { point: "A", key: "personality", label: "Личность" },
  { point: "E", key: "center", label: "Центр" },
  { point: "D", key: "task", label: "Задача" },
] as const satisfies readonly { point: MatrixPoint; key: "personality" | "center" | "task"; label: string }[];

export const PURPOSES = [
  { point: "personal", label: "Личное" },
  { point: "social", label: "Социальное" },
  { point: "spiritual", label: "Духовное" },
] as const satisfies readonly { point: MatrixPoint; label: string }[];

const OUTER = { A: "личность", B: "верхняя точка", C: "правая точка", D: "задача", E: "центр" } as const;
const FAMILY = { F: "A+B", G: "B+C", H: "C+D", I: "D+A" } as const;

function innerLabels(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const x of ["A", "B", "C", "D", "F", "G", "H", "I"]) {
    labels[`${x}1`] = `${x}1 — у точки ${x}`;
    labels[`${x}2`] = `${x}2 — между ${x} и центром`;
  }
  return labels;
}

export const POINT_LABELS = {
  ...Object.fromEntries(Object.entries(OUTER).map(([point, name]) => [point, `${point} — ${name}`])),
  ...Object.fromEntries(Object.entries(FAMILY).map(([point, sum]) => [point, `${point} — родовая точка (${sum})`])),
  ...innerLabels(),
  heart: "линия отношений и денег",
  love: "отношения",
  money: "деньги",
  sky: "небо",
  earth: "земля",
  personal: "личное предназначение",
  male: "мужская линия",
  female: "женская линия",
  social: "социальное предназначение",
  spiritual: "духовное предназначение",
  planetary: "планетарное предназначение",
} as Record<MatrixPoint, string>;

export type DiagramPoint = { point: MatrixPoint; x: number; y: number; r: number; tier: "key" | "main" | "family" | "inner" | "line" };

export const DIAGRAM_SIZE = 400;

const at = (point: MatrixPoint, x: number, y: number, r: number, tier: DiagramPoint["tier"]): DiagramPoint => ({ point, x, y, r, tier });

// Поле 400×400, центр (200, 200). Основной квадрат — ромб по осям, родовой — по углам; внутренние точки на линиях к центру
export const DIAGRAM_POINTS: readonly DiagramPoint[] = [
  at("A", 30, 200, 22, "key"),
  at("B", 200, 30, 20, "main"),
  at("C", 370, 200, 20, "main"),
  at("D", 200, 370, 22, "key"),
  at("E", 200, 200, 26, "key"),
  at("F", 80, 80, 18, "family"),
  at("G", 320, 80, 18, "family"),
  at("H", 320, 320, 18, "family"),
  at("I", 80, 320, 18, "family"),
  at("A1", 72, 200, 13, "inner"),
  at("A2", 118, 200, 13, "inner"),
  at("B1", 200, 72, 13, "inner"),
  at("B2", 200, 118, 13, "inner"),
  at("C1", 328, 200, 13, "inner"),
  at("C2", 282, 200, 13, "inner"),
  at("D1", 200, 328, 13, "inner"),
  at("D2", 200, 282, 13, "inner"),
  at("F1", 110, 110, 12, "inner"),
  at("F2", 142, 142, 12, "inner"),
  at("G1", 290, 110, 12, "inner"),
  at("G2", 258, 142, 12, "inner"),
  at("H1", 290, 290, 12, "inner"),
  at("H2", 258, 258, 12, "inner"),
  at("I1", 110, 290, 12, "inner"),
  at("I2", 142, 258, 12, "inner"),
  at("money", 304, 244, 12, "line"),
  at("heart", 266, 282, 12, "line"),
  at("love", 228, 320, 12, "line"),
];

export const DIAGRAM_LINES: readonly (readonly [MatrixPoint, MatrixPoint])[] = [
  ["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"],
  ["F", "G"], ["G", "H"], ["H", "I"], ["I", "F"],
  ["A", "C"], ["B", "D"], ["F", "H"], ["G", "I"],
  ["money", "love"],
];

export function pointTitle(point: MatrixPoint, value: number): string {
  return `${POINT_LABELS[point]}: ${value}, ${arcanumByNumber(value).name}`;
}

export function pointRows(matrix: Matrix): { point: MatrixPoint; label: string; value: number; name: string }[] {
  return MATRIX_POINTS.map((point) => ({ point, label: POINT_LABELS[point], value: matrix[point], name: arcanumByNumber(matrix[point]).name }));
}
```

Run: тест Step 1 — Expected: PASS. Если тест пересечений укажет пару точек — сдвинуть внутреннюю точку вдоль её линии на 4–6 единиц (не менять основной и родовой квадраты) и повторить.

- [ ] **Step 3: Диаграмма**

`apps/web/src/components/matrix/MatrixDiagram.tsx`:

```tsx
import type { Matrix } from "@oracle/core";
import { DIAGRAM_LINES, DIAGRAM_POINTS, DIAGRAM_SIZE, pointRows, pointTitle } from "@/lib/matrix-view";

const byPoint = new Map(DIAGRAM_POINTS.map((p) => [p.point, p]));

export function MatrixDiagram({ matrix }: { matrix: Matrix }) {
  return (
    <figure className="matrix-diagram">
      <svg viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} role="img" aria-labelledby="matrix-diagram-title">
        <title id="matrix-diagram-title">Диаграмма матрицы судьбы: все точки с номерами арканов. Подробная таблица — ниже.</title>
        <circle className="matrix-diagram__ring" cx={DIAGRAM_SIZE / 2} cy={DIAGRAM_SIZE / 2} r={DIAGRAM_SIZE / 2 - 18} />
        {DIAGRAM_LINES.map(([from, to]) => {
          const a = byPoint.get(from)!;
          const b = byPoint.get(to)!;
          return <line key={`${from}-${to}`} className="matrix-diagram__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
        {DIAGRAM_POINTS.map(({ point, x, y, r, tier }) => (
          <g key={point} className={`matrix-point matrix-point--${tier}`}>
            <title>{pointTitle(point, matrix[point])}</title>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {matrix[point]}
            </text>
          </g>
        ))}
      </svg>
      <table className="visually-hidden">
        <caption>Точки матрицы</caption>
        <thead>
          <tr>
            <th scope="col">Точка</th>
            <th scope="col">Аркан</th>
          </tr>
        </thead>
        <tbody>
          {pointRows(matrix).map((row) => (
            <tr key={row.point}>
              <th scope="row">{row.label}</th>
              <td>
                {row.value}, {row.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
```

- [ ] **Step 4: Секция результата**

`apps/web/src/components/matrix/MatrixResult.tsx`:

```tsx
import type { Matrix } from "@oracle/core";
import { arcanumByNumber, SECTION_TITLES } from "@oracle/content";
import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { arcanumPath } from "@/lib/arcana-paths";
import { KEY_POINTS, PURPOSES } from "@/lib/matrix-view";
import { MatrixDiagram } from "./MatrixDiagram";

type Props = { matrix: Matrix; dateLabel: string; headingRef?: Ref<HTMLHeadingElement>; actions?: ReactNode };

export function MatrixResult({ matrix, dateLabel, headingRef, actions }: Props) {
  const center = arcanumByNumber(matrix.E);
  return (
    <section className="matrix-result stack" aria-labelledby="matrix-result-title">
      <p className="eyebrow eyebrow--line">Ваша матрица · {dateLabel}</p>
      <h2 id="matrix-result-title" className="matrix-result__title" tabIndex={-1} ref={headingRef}>
        Ваша матрица судьбы
      </h2>

      <div className="matrix-result__top">
        <MatrixDiagram matrix={matrix} />
        <ul className="matrix-keys" aria-label="Ключевые точки">
          {KEY_POINTS.map(({ point, key, label }) => {
            const arcanum = arcanumByNumber(matrix[point]);
            return (
              <li key={point} className="card matrix-key stack">
                <div className="matrix-key__head">
                  <span className="matrix-key__number" aria-hidden="true">
                    {arcanum.number}
                  </span>
                  <div>
                    <p className="eyebrow">
                      {label} · точка {point}
                    </p>
                    <h3>
                      <span className="visually-hidden">Аркан {arcanum.number}, </span>
                      {arcanum.name}
                    </h3>
                  </div>
                </div>
                {arcanum[key].map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <Link href={arcanumPath(arcanum)}>Подробнее об аркане «{arcanum.name}»</Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="matrix-today">
        <div className="card stack">
          <p className="eyebrow">{SECTION_TITLES.action}</p>
          <p>{center.action}</p>
        </div>
        <div className="card stack">
          <p className="eyebrow">{SECTION_TITLES.question}</p>
          <p className="arcanum-question">{center.question}</p>
        </div>
      </div>

      <section className="card stack" aria-labelledby="matrix-purposes">
        <h3 id="matrix-purposes">Предназначения</h3>
        <table className="matrix-purposes">
          <tbody>
            {PURPOSES.map(({ point, label }) => {
              const arcanum = arcanumByNumber(matrix[point]);
              return (
                <tr key={point}>
                  <th scope="row">{label}</th>
                  <td>
                    {arcanum.number} · {arcanum.name}
                  </td>
                  <td>
                    <Link href={arcanumPath(arcanum)}>об аркане</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {actions}

      <aside className="card matrix-next">
        <span className="tag">Скоро</span>
        <p>Лила — игра с вашим вопросом</p>
      </aside>
    </section>
  );
}
```

Примечание: метка «Скоро» у анонса Лилы — отдельный элемент внутри результата калькулятора; e2e главной (задача 9, Step 6) считает «Скоро» только на главной странице.

- [ ] **Step 5: Стили**

В `apps/web/src/app/globals.css` перед `/* Карточки практик` добавить:

```css
/* Доступный только скринридерам текст (таблица точек матрицы) */
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Результат матрицы: диаграмма и три ключевые карточки, затем действие, вопрос, предназначения */
.matrix-result__title { font-size: clamp(32px, 5vw, 48px); outline: none; }
.matrix-result__top { display: grid; gap: 24px; align-items: start; }
.matrix-diagram { margin: 0; }
.matrix-diagram svg { display: block; width: 100%; max-width: 480px; height: auto; margin-inline: auto; }
.matrix-diagram__ring { fill: none; stroke: var(--line); stroke-dasharray: 3 5; }
.matrix-diagram__line { stroke: var(--line-strong); stroke-width: 1; }
.matrix-point circle { fill: var(--surface-2); stroke: var(--line-strong); stroke-width: 1; }
.matrix-point text { fill: var(--ink); font-family: var(--font-display); font-size: 14px; }
.matrix-point--key circle { fill: var(--surface-3); stroke: var(--accent); stroke-width: 2; }
.matrix-point--key text { fill: var(--accent); font-size: 18px; }
.matrix-point--main text, .matrix-point--family text { font-size: 16px; }
.matrix-point--inner text, .matrix-point--line text { fill: var(--ink-soft); font-size: 12px; }
.matrix-point--line circle { stroke: var(--lavender); }
.matrix-keys { display: grid; gap: 16px; list-style: none; margin: 0; padding: 0; }
.matrix-key__head { display: flex; gap: 16px; align-items: center; }
.matrix-key__number { flex: none; display: grid; place-items: center; width: 56px; height: 56px; border: 1px solid var(--accent-line); border-radius: 50%; color: var(--accent); font-family: var(--font-display); font-size: 26px; }
.matrix-key h3 { font-size: 26px; }
.matrix-key p { margin: 0; }
.matrix-today { display: grid; gap: 16px; }
.matrix-today p { margin: 0; }
.matrix-purposes { width: 100%; border-collapse: collapse; }
.matrix-purposes th, .matrix-purposes td { padding: 12px 8px; border-top: 1px solid var(--line); text-align: left; font-weight: 400; }
.matrix-purposes th { color: var(--ink-soft); }
.matrix-purposes td:last-child { text-align: right; }
.matrix-purposes a { display: inline-flex; align-items: center; min-height: 44px; }
.matrix-next { display: flex; gap: 12px; align-items: center; }
.matrix-next p { margin: 0; color: var(--ink-soft); }
@media (min-width: 900px) {
  .matrix-result__top { grid-template-columns: minmax(360px, 1fr) 1fr; }
  .matrix-today { grid-template-columns: 1fr 1fr; }
}
```

Проверить в `.matrix-point--inner text` размер 12 px: это цифры внутри SVG, масштабируемые вместе с диаграммой (не текст абзаца); на 375 px диаграмма шириной ~343 px — цифры внутренних точек ≈ 10 px, поэтому все значения продублированы в таблице для скринридеров и в подсказке `<title>`. Правило «не меньше 14 px» относится к тексту страницы.

- [ ] **Step 6: Проверки**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. (Визуальная проверка — в задаче 8, когда секция появится на странице.)

- [ ] **Step 7: Коммит**

```bash
git add apps/web/src/lib/matrix-view.ts apps/web/src/lib/matrix-view.test.ts apps/web/src/components/matrix apps/web/src/app/globals.css
git commit -m "feat(web): matrix result view — diagram layout, key points, purposes"
```
