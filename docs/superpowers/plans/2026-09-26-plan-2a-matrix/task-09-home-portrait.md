# Задача 9 — главная и «Мой портрет» ведут в матрицу

**Files:**
- Modify: `apps/web/src/lib/practices.ts`, `apps/web/src/lib/practices.test.ts`
- Modify: `apps/web/src/lib/matrix-view.ts`, `apps/web/src/lib/matrix-view.test.ts` (функция `keyArcana`)
- Modify: `apps/web/src/app/page.tsx`, `apps/web/src/app/portret/page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `e2e/portrait.spec.ts` (счёт меток «Скоро» на главной)

**Interfaces:**
- Consumes: `MATRIX_PATH` (задача 6), `calculateMatrix` (задача 1), `KEY_POINTS` (задача 7), `arcanumByNumber`.
- Produces:
  - `type Practice = { slug; title; summary; href: string | null }` — `href` у открытой практики, `null` у будущих
  - `keyArcana(matrix: Matrix): { point: MatrixPoint; label: string; number: number; name: string }[]` — три ключевые точки по порядку A, E, D
  - на главной карточка «Матрица судьбы» — ссылка на `/matrica-sudby` с меткой «Открыто»; остальные — «Скоро»
  - в портрете карточка матрицы: при сохранённой дате — три аркана и «Открыть расчёт», иначе — «Рассчитать матрицу»; метка «Открыто»

## Зачем

Спецификация 2а, раздел 4 (главная, портрет); каркас, экран 5. Матрица — первая открытая практика: на главной вся карточка ведёт в калькулятор, в портрете видно «что уже собрано».

## Шаги

- [ ] **Step 1: Падающие тесты**

`apps/web/src/lib/practices.test.ts` — добавить:

```ts
  test("only the matrix is open for now, and it leads to the calculator", () => {
    expect(PRACTICES.map((practice) => [practice.slug, practice.href])).toEqual([
      ["matrix", "/matrica-sudby"],
      ["lila", null],
      ["tarot", null],
      ["natal", null],
    ]);
  });
```

`apps/web/src/lib/matrix-view.test.ts` — добавить импорт `keyArcana` и тест:

```ts
describe("keyArcana", () => {
  test("lists personality, center and task with arcana names", () => {
    expect(keyArcana(calculateMatrix({ year: 1988, month: 11, day: 18 }))).toEqual([
      { point: "A", label: "Личность", number: 18, name: "Луна" },
      { point: "E", label: "Центр", number: 11, name: "Сила" },
      { point: "D", label: "Задача", number: 10, name: "Колесо Фортуны" },
    ]);
  });
});
```

Run: `pnpm vitest run --project web apps/web/src/lib/practices.test.ts apps/web/src/lib/matrix-view.test.ts` — Expected: FAIL.

- [ ] **Step 2: Реализация**

`apps/web/src/lib/practices.ts`:

```ts
import { MATRIX_PATH } from "./arcana-paths";

export type Practice = { slug: "matrix" | "lila" | "tarot" | "natal"; title: string; summary: string; href: string | null };

// Порядок — порядок запуска из спецификации (раздел 6); href есть только у открытых практик
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "22 аркана по дате рождения: сильные стороны, повторяющиеся сценарии и точки роста.", href: MATRIX_PATH },
  { slug: "lila", title: "Лила", summary: "Игра с намерением на поле из 72 клеток — повод посмотреть на свой вопрос по-новому.", href: null },
  { slug: "tarot", title: "Таро", summary: "Расклад на вопрос и карта дня: символы как зеркало, а не приговор.", href: null },
  { slug: "natal", title: "Натальная карта", summary: "Настоящий расчёт по дате, времени и месту рождения.", href: null },
];
```

В `apps/web/src/lib/matrix-view.ts` добавить:

```ts
export function keyArcana(matrix: Matrix): { point: MatrixPoint; label: string; number: number; name: string }[] {
  return KEY_POINTS.map(({ point, label }) => ({ point, label, number: matrix[point], name: arcanumByNumber(matrix[point]).name }));
}
```

Run: тесты Step 1 — Expected: PASS.

- [ ] **Step 3: Главная**

В `apps/web/src/app/page.tsx` добавить `import Link from "next/link";` (если ещё нет) и заменить содержимое `<div className="practice-card__body">…</div>`:

```tsx
                <div className="practice-card__body">
                  <span className={practice.href ? "tag tag--open" : "tag"}>{practice.href ? "Открыто" : "Скоро"}</span>
                  <h3>
                    {practice.href ? (
                      <Link className="practice-card__link" href={practice.href}>
                        {practice.title}
                      </Link>
                    ) : (
                      practice.title
                    )}
                  </h3>
                  <p>{practice.summary}</p>
                </div>
```

- [ ] **Step 4: Портрет**

В `apps/web/src/app/portret/page.tsx`:
- импорты: `import { calculateMatrix } from "@oracle/core";` (добавить к существующему импорту из `@oracle/core`), `import { keyArcana } from "@/lib/matrix-view";`;
- перед `return (` авторизованной ветки: `const keys = birthDate ? keyArcana(calculateMatrix(birthDate)) : null;`
- заменить содержимое `<div className="portrait-practice__body">…</div>`:

```tsx
              <div className="portrait-practice__body">
                <h3>{practice.title}</h3>
                {practice.href && keys ? (
                  <ul className="portrait-keys" aria-label="Ключевые арканы">
                    {keys.map((key) => (
                      <li key={key.point}>
                        <span className="portrait-keys__number">{key.number}</span>
                        <span>
                          {key.label} · {key.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{practice.summary}</p>
                )}
                {practice.href ? (
                  <Link className="button button--ghost portrait-practice__cta" href={practice.href}>
                    {keys ? "Открыть расчёт" : "Рассчитать матрицу"}
                  </Link>
                ) : (
                  <span className="tag">Скоро</span>
                )}
              </div>
```

- [ ] **Step 5: Стили**

В `apps/web/src/app/globals.css` после правила `.practice-card p { … }` добавить:

```css
.tag--open { border-color: var(--accent-line); color: var(--accent); }
/* Вся карточка кликабельна через растянутую ссылку в заголовке */
.practice-card__link { color: inherit; text-decoration: none; }
.practice-card__link::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.practice-card:has(.practice-card__link:focus-visible) { outline: 2px solid var(--accent); outline-offset: 3px; }
.practice-card:has(.practice-card__link):hover { border-color: var(--accent-line); }
.portrait-keys { display: grid; gap: 8px; list-style: none; margin: 0; padding: 0; color: var(--ink-soft); font-size: 14px; }
.portrait-keys li { display: flex; gap: 10px; align-items: center; }
.portrait-keys__number { display: inline-grid; place-items: center; min-width: 32px; height: 32px; border: 1px solid var(--accent-line); border-radius: 50%; color: var(--accent); font-family: var(--font-display); }
.portrait-practice__cta { margin-top: auto; align-self: flex-start; }
```

- [ ] **Step 6: Сквозной тест главной**

В `e2e/portrait.spec.ts`, тест «a visitor goes from the home page…», строку

```ts
  await expect(page.getByText("Скоро")).toHaveCount(4);
```

заменить на

```ts
  await expect(page.getByText("Скоро", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Открыто", { exact: true })).toHaveCount(1);
```

- [ ] **Step 7: Проверки**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

Локально: главная — клик по любой части карточки «Матрица судьбы» открывает `/matrica-sudby`, фокус Tab на карточке виден; портрет с сохранённой датой 18.11.1988 показывает «Личность · Луна», «Центр · Сила», «Задача · Колесо Фортуны» и «Открыть расчёт»; без даты — «Рассчитать матрицу».

- [ ] **Step 8: Коммит**

```bash
git add apps/web/src/lib/practices.ts apps/web/src/lib/practices.test.ts apps/web/src/lib/matrix-view.ts apps/web/src/lib/matrix-view.test.ts apps/web/src/app/page.tsx apps/web/src/app/portret/page.tsx apps/web/src/app/globals.css e2e/portrait.spec.ts
git commit -m "feat(web): matrix is open on the home page and summarised in the portrait"
```
