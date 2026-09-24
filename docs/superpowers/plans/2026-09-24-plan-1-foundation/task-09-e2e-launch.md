# Задача 9 — Сквозные сценарии, итоговые проверки, PR, выкладка, ручная проверка

**Files:**
- Create: `e2e/playwright.config.ts`, `e2e/helpers.ts`, `e2e/portrait.spec.ts`, `e2e/launch.spec.ts`
- Modify: `docs/superpowers/plans/2026-09-24-plan-1-foundation/00-overview.md` (статус плана)
- Modify (если значения уже есть): `apps/web/src/lib/analytics.ts` (`METRIKA_ID`, `YANDEX_VERIFICATION`)

**Interfaces:**
- Consumes: всё приложение плана 1; dev-вход `GET /api/dev/login?name=...` (задача 5); `CONSENT_KEY` = `oracle-cookie-consent` (задача 7).
- Produces: `signIn(browser, name): Promise<{ context; page }>`, `uniqueName(prefix): string`, `BASE_URL` в `e2e/helpers.ts` — их переиспользуют сквозные тесты следующих планов.

## Зачем

Юнит-тесты проверяют сервисы по отдельности; сквозные — что человек на телефоне действительно проходит путь «главная → вход → дата в портрете → удаление данных» и что личные страницы закрыты от поиска. Настройка Playwright как в Гранях: только локальное приложение, установленный Chrome, мобильный профиль Pixel 7.

## Шаги

- [ ] **Шаг 1. Настройка Playwright.**

`e2e/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

// Только локальное приложение: dev-вход работает лишь с DEV_LOGIN=1 и не в production.
// Браузер — установленный Chrome: CDN со сборками Playwright с машины разработчика недоступен
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: ".",
  outputDir: "test-results",
  timeout: 90_000,
  retries: 0,
  // next dev компилирует страницу при первом заходе — переход бывает дольше 5 секунд по умолчанию
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    locale: "ru-RU",
    trace: "retain-on-failure",
    // Cookie-баннер закрывает низ экрана — в сценариях выбор уже сделан; сценарий баннера сбрасывает его сам
    storageState: { cookies: [], origins: [{ origin: BASE_URL, localStorage: [{ name: "oracle-cookie-consent", value: "necessary" }] }] },
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], channel: process.env.PW_CHANNEL ?? "chrome" } }],
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
});
```

`e2e/helpers.ts`:

```ts
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

// Тот же адрес, что в playwright.config.ts
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Имя через пробел: на странице показывается первое слово, а dev-вход различает пользователей по полному имени
export const uniqueName = (prefix: string) => `${prefix} ${Date.now()}${Math.floor(Math.random() * 1000)}`;

export async function signIn(browser: Browser, name: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  await expect(page).toHaveURL(/\/portret$/);
  return { context, page };
}
```

- [ ] **Шаг 2. Сценарии.**

`e2e/portrait.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

test("a visitor goes from the home page to the portrait and is invited to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Иногда нужен не ответ");
  await expect(page.getByText("Скоро")).toHaveCount(4);

  await page.getByRole("link", { name: "Открыть портрет" }).click();

  await expect(page).toHaveURL(/\/portret$/);
  await expect(page.getByRole("link", { name: "Войти через VK ID" })).toBeVisible();
});

test("the login button waits for consent", async ({ page }) => {
  await page.goto("/login");
  const button = page.getByRole("button", { name: "Войти через VK ID" });

  await expect(button).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(button).toBeEnabled();
});

test("a signed-in user saves the birth date and sees it after a reload", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Аня"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Здравствуйте, Аня");

  await page.getByLabel("Дата рождения").fill("1990-03-07");
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByRole("status")).toHaveText("Сохранено.");
  await page.reload();
  await expect(page.getByText("7 марта 1990")).toBeVisible();
  await context.close();
});

test("a future date is refused with a clear message", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Боря"));

  await page.getByLabel("Дата рождения").fill("2099-01-01");
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByRole("alert")).toContainText("не позже сегодняшней");
  await context.close();
});

test("deleting the data ends the session and a new login starts an empty portrait", async ({ browser }) => {
  const name = uniqueName("Вера");
  const { context, page } = await signIn(browser, name);
  await page.getByLabel("Дата рождения").fill("1985-12-31");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status")).toHaveText("Сохранено.");

  await page.getByRole("link", { name: "Удалить мои данные" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();

  await expect(page).toHaveURL(/\/\?deleted=1$/);
  await page.goto("/portret");
  await expect(page.getByRole("link", { name: "Войти через VK ID" })).toBeVisible();

  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  await expect(page.getByText("31 декабря 1985")).toHaveCount(0);
  await context.close();
});

test("logging out returns to the home page", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Гоша"));

  await page.getByRole("button", { name: "Выйти" }).click();

  await expect(page).toHaveURL(/\/$/);
  await page.goto("/portret");
  await expect(page.getByRole("link", { name: "Войти через VK ID" })).toBeVisible();
  await context.close();
});
```

`e2e/launch.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { BASE_URL } from "./helpers";

test("public pages are indexable and private pages are not", async ({ page }) => {
  for (const path of ["/", "/privacy", "/consent", "/contacts"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  }
  for (const path of ["/login", "/portret"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  }
});

test("robots.txt and sitemap.xml describe the public site", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();

  expect(robots).toContain("Disallow: /portret");
  expect(robots).toContain("Sitemap:");
  expect(sitemap).toContain("/privacy");
  expect(sitemap).not.toContain("/portret");
});

test("every page carries the disclaimer and the document links", async ({ page }) => {
  await page.goto("/contacts");
  const footer = page.locator("footer");

  await expect(footer).toContainText("не предсказания");
  await expect(footer.getByRole("link", { name: "Политика обработки данных" })).toBeVisible();
});

test("the cookie banner asks once and can be reopened from the footer", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/`);
  const banner = page.getByRole("dialog", { name: "Cookie" });

  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Только необходимые" }).click();
  await expect(banner).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("oracle-cookie-consent"))).toBe("necessary");

  await page.reload();
  await expect(banner).toBeHidden();
  await page.getByRole("button", { name: "Настройки cookie" }).click();
  await expect(banner).toBeVisible();
  await context.close();
});

test("state-changing endpoints refuse requests from other sites", async ({ request }) => {
  for (const path of ["/api/consent", "/api/profile/birth-date", "/api/me/delete", "/api/auth/logout"]) {
    const response = await request.post(path, { headers: { origin: "https://evil.test" }, data: {} });
    expect(response.status(), path).toBe(403);
  }
});
```

- [ ] **Шаг 3. Прогон.** В двух терминалах `pnpm dev:db` и `pnpm dev:web` (с `apps/web/.env.development.local` из задачи 3), затем:

```bash
export PATH="/c/Users/olya8/AppData/Roaming/npm:$PATH"
pnpm test:e2e
```

Ожидается: все сценарии PASS. Упавший сценарий — сначала разобраться в причине (`e2e/playwright-report`), чинить код, а не тест, если тест прав.

- [ ] **Шаг 4. Итоговые проверки.**

```bash
pnpm typecheck
pnpm test:coverage
NEXT_PUBLIC_SITE_URL=https://oracle.test pnpm --filter @oracle/web build
grep -rni grani --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.next --exclude=server-setup.md . || echo "no grani leftovers"
```

Ожидается: без ошибок; покрытие ≥ 80% по строкам, ветвям, функциям и выражениям; сборка без предупреждений; `no grani leftovers`.

Номер счётчика Метрики и код Вебмастера: если владелица их уже прислала, вписать в `apps/web/src/lib/analytics.ts` (задача 7, шаг 5) и прогнать `pnpm vitest run apps/web/src/lib`.

- [ ] **Шаг 5. Статус плана.** В начало `00-overview.md` (под заголовок) добавить блок со статусом: дата, число юнит- и сквозных тестов, покрытие по четырём метрикам, что осталось сделать руками. Коммит:

```bash
git add e2e docs apps/web/src/lib/analytics.ts
git commit -m "test(e2e): portrait, login, indexing, cookie banner and origin checks"
```

- [ ] **Шаг 6. PR.** С согласия владелицы:

```bash
git push -u origin feat/foundation
gh pr create --base master --title "Plan 1: foundation — VK ID login, portrait, documents, deploy" --body-file - <<'EOF'
## Что внутри

- Монорепо на стеке Граней: `@oracle/core` (дата рождения), `@oracle/db` (пользователи, VK ID, профиль рождения, удаление данных), `@oracle/web` (Next.js 16).
- Главная с четырьмя практиками «скоро», тёмная визуальная система из v0.9 (`docs/design/visual-direction.md`).
- Вход через VK ID с PKCE и согласием; «Мой портрет» с датой рождения; «Удалить мои данные».
- Политика, согласие, контакты, оговорка «не предсказания» в подвале; cookie-баннер, Метрика только после согласия.
- `robots.txt`, `sitemap.xml`, `noindex` для личных страниц.
- Образы `oracle-web` и `oracle-migrate`, выкладка на общий VPS со smoke-проверками.

## Проверки

- [ ] `pnpm typecheck`, `pnpm test:coverage` (≥ 80%)
- [ ] `pnpm test:e2e` на локальном приложении
- [ ] production-сборка с `NEXT_PUBLIC_SITE_URL`
- [ ] после мержа: workflow `images` и `deploy` зелёные, smoke-проверки прошли
- [ ] ручная проверка на телефоне (вход через настоящий VK ID, дата, удаление)
EOF
```

Дождаться зелёного CI. Мерж — только после явного согласия владелицы.

- [ ] **Шаг 7. Выкладка.** Перед мержем убедиться, что задача 8, шаг 6 выполнена (БД, `.env`, Caddy, `SITE_URL`, секреты, VK ID). После мержа: workflow `images` публикует два образа, `deploy` выкладывает и проходит smoke-проверки. Если `deploy` упал — читать его лог, при необходимости `docker logs --since 30m oracle-web-1` на сервере (с разрешения владелицы).

- [ ] **Шаг 8. Ручная проверка на телефоне (владелица).**
  1. Главная открывается по домену с замком HTTPS, тёмная тема, четыре карточки «Скоро».
  2. «Открыть портрет» → «Войти через VK ID» → согласие → вход через настоящий VK ID → портрет с именем.
  3. Сохранить дату рождения; закрыть браузер, открыть снова — дата на месте.
  4. «Принять» в cookie-баннере; через несколько минут в Метрике виден визит и цели `login` и `birth_date_saved` (если номер счётчика уже вписан).
  5. «Удалить мои данные» → портрет пустой, повторный вход создаёт новый портрет.
  6. Трекер, wishlist и Грани открываются как раньше.

После ручной проверки обновить статус в `00-overview.md` («выложено и проверено»), закоммитить в `master` через маленький PR или вместе с первым PR плана 2.
