# Задача 10 — сквозные сценарии, проверки выкладки, `AGENTS.md`, PR и выкладка

**Files:**
- Create: `e2e/matrix.spec.ts`
- Modify: `e2e/launch.spec.ts`
- Modify: `.github/workflows/deploy.yml` (smoke-проверки)
- Modify: `AGENTS.md`, `docs/superpowers/plans/2026-09-26-plan-2a-matrix/00-overview.md` (статус)

**Interfaces:**
- Consumes: всё из задач 1–9; `signIn`, `uniqueName`, `BASE_URL` из `e2e/helpers.ts`.
- Produces: зелёные e2e, smoke выкладки для матрицы, PR `feat/matrix-free` → `master`.

## Зачем

Спецификация 2а, раздел 7 (e2e) и 9 («Готово, когда»). Сквозные сценарии проверяют то, что нельзя проверить юнит-тестами: браузерное хранилище, возврат со входа, автосохранение, индексацию страниц. Smoke выкладки ловит сломанную сборку до того, как её увидят люди.

## Шаги

- [ ] **Step 1: Локальный сервер для e2e**

Порт 3000 на машине разработчика может быть занят другим проектом. Сервер ORACLE для e2e поднимается на 3100 с `APP_URL`/`NEXT_PUBLIC_SITE_URL=http://localhost:3100` (иначе проверка `Origin` отклонит POST). В сессии Claude Code — конфигурация `oracle-3100` в `C:\dev\wishlist\.claude\launch.json` (скрипт запускает `pnpm dev:db` и `next dev -p 3100` с этими переменными). Прогон:

```bash
E2E_BASE_URL=http://localhost:3100 pnpm test:e2e
```

- [ ] **Step 2: Сценарии матрицы**

`e2e/matrix.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

async function calculate(page: Page, iso: string) {
  await page.getByRole("textbox", { name: "Дата рождения" }).fill(iso);
  await page.getByRole("button", { name: "Рассчитать" }).click();
}

const result = (page: Page) => page.getByRole("region", { name: "Ваша матрица судьбы" });

test("the home page leads to the open matrix calculator", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Матрица судьбы" }).click();

  await expect(page).toHaveURL(/\/matrica-sudby$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Матрица судьбы по дате рождения");
});

test("a visitor gets the matrix without login and the browser remembers the date", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "1988-11-18");

  await expect(result(page).getByRole("heading", { name: "Аркан 18, Луна" })).toBeVisible();
  await expect(result(page).getByRole("heading", { name: "Аркан 11, Сила" })).toBeVisible();
  await expect(result(page).getByRole("heading", { name: "Аркан 10, Колесо Фортуны" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти и сохранить" })).toHaveAttribute("href", "/login?next=%2Fmatrica-sudby");

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1988-11-18");
  await expect(result(page).getByRole("heading", { name: "Аркан 11, Сила" })).toBeVisible();
  expect(page.url()).not.toContain("1988");
});

test("an impossible date is refused with a clear message", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "2099-01-01");

  await expect(page.getByRole("alert").filter({ hasText: "не позже сегодняшней" })).toBeVisible();
  await expect(result(page)).toHaveCount(0);
});

test("«Войти и сохранить» brings the person back and saves the date into an empty portrait", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "1988-11-18");
  await page.getByRole("link", { name: "Войти и сохранить" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fmatrica-sudby$/);

  // VK ID на localhost недоступен — dev-вход повторяет возврат со входа с тем же next
  await page.goto(`/api/dev/login?name=${encodeURIComponent(uniqueName("Лея"))}&next=/matrica-sudby`);
  await expect(page).toHaveURL(/\/matrica-sudby/);
  await expect(page.locator(".save-block").getByRole("status")).toHaveText("Сохранено.");

  await page.goto("/portret");
  await expect(page.getByText("18 ноября 1988")).toBeVisible();
  await expect(page.getByText("Центр · Сила")).toBeVisible();
});

test("the portrait date wins over another date in the browser", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Ира"));
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1990-05-14");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status")).toHaveText("Сохранено.");

  await page.evaluate(() => localStorage.setItem("oracle-birth-date", "1988-11-18"));
  await page.goto("/matrica-sudby");

  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1990-05-14");
  await expect(page.locator(".save-block").getByRole("status")).toHaveText("Сохранено.");
  await context.close();
});

test("deleting the data also clears the browser copy of the date", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Ната"));
  await page.goto("/matrica-sudby");
  await calculate(page, "1977-07-23");
  await expect(result(page)).toBeVisible();

  await page.goto("/portret/delete");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1$/);

  expect(await page.evaluate(() => localStorage.getItem("oracle-birth-date"))).toBeNull();
  await context.close();
});

test("an arcanum page is indexable and leads to the calculator", async ({ page }) => {
  await page.goto("/matrica-sudby/arkan-11-sila");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Сила");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

  await page.getByRole("link", { name: "Рассчитать свою матрицу" }).first().click();
  await expect(page).toHaveURL(/\/matrica-sudby$/);
});

test("an unknown arcanum address is a 404", async ({ request }) => {
  expect((await request.get("/matrica-sudby/arkan-11-mag")).status()).toBe(404);
  expect((await request.get("/matrica-sudby/arkan-23-x")).status()).toBe(404);
});
```

В `e2e/launch.spec.ts`:
- в первом тесте список публичных путей: `["/", "/matrica-sudby", "/matrica-sudby/arkan-11-sila", "/privacy", "/consent", "/contacts"]`;
- во втором тесте после `expect(sitemap).toContain("/privacy");` добавить `expect(sitemap).toContain("/matrica-sudby/arkan-22-shut");`.

Run: `E2E_BASE_URL=http://localhost:3100 pnpm test:e2e`
Expected: все сценарии PASS (11 старых + 8 новых). При падении — сначала `trace` в `e2e/test-results`, исправлять код, а не ожидания (ожидания меняются, только если они противоречат спецификации).

- [ ] **Step 3: Smoke выкладки**

В `.github/workflows/deploy.yml`, в удалённом скрипте после строки `curl -fsS "$SITE/robots.txt" > "$tmp/robots.txt"` добавить:

```bash
          curl -fsS "$SITE/matrica-sudby" > "$tmp/matrix.html"
          curl -fsS "$SITE/matrica-sudby/arkan-11-sila" > "$tmp/arcanum.html"
```

и после строки `assert_contains 'Disallow: /portret' "$tmp/robots.txt" "robots private pages"`:

```bash
          assert_contains '<h1 class="display">Матрица судьбы по дате рождения</h1>' "$tmp/matrix.html" "matrix calculator"
          assert_contains 'content="index, follow"' "$tmp/matrix.html" "matrix indexable"
          assert_contains 'application/ld+json' "$tmp/arcanum.html" "arcanum article markup"
          assert_contains "$SITE/matrica-sudby/arkan-22-shut" "$tmp/sitemap.xml" "sitemap arcana"
          assert_status "404" "unknown arcanum is 404" "$SITE/matrica-sudby/arkan-11-mag"
```

Проверить синтаксис: `bash -n` на извлечённом скрипте не нужен — достаточно, что строки добавлены внутрь блока `REMOTE` с тем же отступом.

- [ ] **Step 4: `AGENTS.md`**

В разделе «Где что лежит» добавить строки таблицы:

```markdown
| Калькулятор матрицы | `apps/web/src/app/matrica-sudby/page.tsx`, `apps/web/src/components/matrix/` |
| Страницы арканов | `apps/web/src/app/matrica-sudby/[arkan]/page.tsx` |
| Тексты арканов | `packages/content/arcana/*.md` (после правки — `pnpm content:build`) |
```

В «Должно остаться на месте», пункт «Тексты кнопок…», дописать: «на калькуляторе матрицы — поле «Дата рождения», кнопки «Рассчитать», «Войти и сохранить», «Сохранить в портрет», «Повторить», «Поделиться», «Рассчитать свою матрицу», отметка «Сохранено.»; метки практик «Открыто»/«Скоро»». В «Роли» дописать: «результат матрицы — `<section aria-labelledby>` с заголовком «Ваша матрица судьбы»; у ключевых арканов в `<h3>` скрытый префикс «Аркан N, »».

- [ ] **Step 5: Итоговые проверки**

Run:

```bash
pnpm typecheck && pnpm test:coverage
NEXT_PUBLIC_SITE_URL=https://tvoy-orakul.ru pnpm --filter @oracle/web build
E2E_BASE_URL=http://localhost:3100 pnpm test:e2e
```

Expected: всё зелёное; покрытие ≥ 80 % по всем метрикам, `packages/core/src/matrix.ts` — 100 %; сборка без ошибок и предупреждений, 22 SSG-страницы арканов.

Скриншоты (Playwright, `channel: "chrome"`) `/matrica-sudby` с результатом 18.11.1988, `/matrica-sudby/arkan-11-sila`, главная и портрет — 1440 и 375 px; проверить: нет горизонтальной прокрутки, текст абзацев ≥ 14 px, зоны нажатия ≥ 44 px. Скриншоты отправить владелице.

- [ ] **Step 6: Статус плана и коммит**

В `00-overview.md` под заголовком добавить раздел «Статус на <дата>» (что готово, число юнит- и e2e-тестов, покрытие, что осталось).

```bash
git add e2e .github/workflows/deploy.yml AGENTS.md docs/superpowers/plans/2026-09-26-plan-2a-matrix/00-overview.md
git commit -m "test(e2e): matrix calculator, saving after login and arcana pages; deploy smoke for the matrix"
```

- [ ] **Step 7: PR (только после вычитки текстов)**

Условие: владелица сказала «да» по текстам 22 арканов (задача 3, Step 7). Затем:

```bash
git push -u origin feat/matrix-free
gh pr create --base master --title "feat: free Matrix of Destiny (plan 2a)" --body-file <файл с описанием: что сделано по разделам спецификации, тесты, скриншоты>
```

Дождаться зелёного CI. **Мерж — только по «да» владелицы.**

- [ ] **Step 8: Выкладка и проверка на сайте**

После мержа дождаться `images` и `deploy`; в логе `deploy` — `Deployment and smoke tests passed.` Проверить снаружи: `https://tvoy-orakul.ru/matrica-sudby` (200, расчёт работает), `/matrica-sudby/arkan-11-sila`, `/sitemap.xml` (24+ адресов). Попросить владелицу пройти путь на телефоне: главная → матрица → «Войти и сохранить» → VK ID → «Сохранено.» → портрет. Напомнить завести в Метрике цели `matrix_calculated`, `matrix_save_click`, `matrix_share`, `arcana_to_calculator` («JavaScript-событие») и отправить новый sitemap в Вебмастер.
