import { expect, test, type Page } from "@playwright/test";

// Калькулятор натальной карты (мобильный Chrome, как остальные сценарии). Нужны dev:db и dev:web; города ищутся по настоящему /api/cities
const NATAL = "/natalnaya-karta";

async function fillBirth(page: Page, p: { date: string; time?: string; city: string; pick?: string }) {
  await page.goto(NATAL);
  const date = page.getByRole("textbox", { name: "Дата рождения" });
  // Поля, заполненные до того, как страница ожила (гидрация), сбрасываются: заполняем повторно, пока значения не удержатся
  await expect(async () => {
    await date.fill(p.date);
    if (p.time === undefined) await page.getByLabel("Время рождения неизвестно").check();
    else await page.getByLabel("Время рождения", { exact: true }).fill(p.time);
    const city = page.getByRole("combobox", { name: "Место рождения" });
    if ((await city.inputValue()) !== (p.pick ?? p.city)) {
      await city.fill(p.city);
      await page.getByRole("option", { name: p.pick ?? p.city }).first().click({ timeout: 4000 });
    }
    await expect(date).toHaveValue(p.date, { timeout: 1000 });
    await expect(page.getByRole("button", { name: "Рассчитать карту" })).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 25_000 });
}

const calculate = async (page: Page) => page.getByRole("button", { name: "Рассчитать карту" }).click();
const result = (page: Page) => page.getByRole("heading", { name: "Ваша натальная карта" });

test("Moscow 07.03.1990 12:00 gives the sample chart on a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Москва" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  await expect(page.getByText("Солнце в Рыбах", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Асцендент в Раке", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator(".natal-table__caption").filter({ hasText: "Дома: Плацидус" })).toBeVisible();
  // «Главная точка карты» берётся из данных: у образца самый тесный аспект — Солнце и Плутон, в Козероге четыре планеты
  const focus = page.locator(".natal-focus");
  await expect(focus.getByRole("heading", { name: "Главная точка карты" })).toBeVisible();
  await expect(focus.getByRole("heading", { name: "Солнце — Плутон: трин" })).toBeVisible();
  await expect(focus.getByRole("heading", { name: "Четыре планеты в Козероге" })).toBeVisible();
  // «Считаем карту…» живёт в области статуса, которая есть в разметке всегда
  await expect(page.locator(".natal-status")).toHaveAttribute("role", "status");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("without a birth time there is no ascendant, no houses and a sign-change warning for the Sun on 20.03.2024", async ({ page }) => {
  await fillBirth(page, { date: "2024-03-20", city: "Москва" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  await expect(page.getByText("Асцендент: нужно время рождения").first()).toBeVisible();
  await expect(page.getByText(/Асцендент в /)).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Дом" })).toHaveCount(0);
  await expect(page.getByText("В этот день Солнце сменило знак — точный знак зависит от времени рождения.").first()).toBeVisible();
  await expect(page.locator(".natal-aspects__note")).toBeVisible();
});

test("a time that did not exist is corrected, and a time that happened twice asks which one before building the chart", async ({ page }) => {
  await fillBirth(page, { date: "1981-04-01", time: "00:30", city: "Москва" });
  await calculate(page);
  await expect(page.getByText(/такого времени не было/).first()).toBeVisible();
  await expect(result(page)).toBeVisible();

  await fillBirth(page, { date: "1990-09-30", time: "02:30", city: "Москва" });
  await calculate(page);
  await expect(page.getByText(/оно было дважды/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Первый раз" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Второй раз" })).toBeVisible();
  await expect(result(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Второй раз" }).click();
  await expect(result(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Второй раз" })).toHaveAttribute("aria-pressed", "true");
});

test("beyond the polar circle the houses are Porphyry and the notice explains why", async ({ page }) => {
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Мурманск" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  await expect(page.getByText(/За полярным кругом асцендент сильно зависит от минуты рождения/).first()).toBeVisible();
  await expect(page.locator(".natal-table__caption").filter({ hasText: "Дома: Порфирий" })).toBeVisible();
});

test("the city list finds a hyphenated name, works with arrows and Enter, and asks to pick a city from the list", async ({ page }) => {
  await page.goto(NATAL);
  const city = page.getByRole("combobox", { name: "Место рождения" });
  await city.fill("ростов на дону");
  await expect(page.getByRole("option", { name: /Ростов-на-Дону/ })).toBeVisible();
  await city.press("ArrowDown");
  await city.press("ArrowUp");
  await city.press("Enter");
  await expect(city).toHaveValue("Ростов-на-Дону");
  await expect(page.getByRole("button", { name: "Рассчитать карту" })).toBeEnabled();

  // Набрали, но город не выбрали из списка — сообщение с role="alert"
  await city.fill("Несуществующий город");
  await expect(page.getByText("Такого города не нашлось.", { exact: false })).toBeVisible();
  await city.blur();
  await expect(page.getByRole("alert").filter({ hasText: "Выберите город из списка" })).toBeVisible();
});

test("a date before 1900 and a date in the future get the range message", async ({ page }) => {
  await fillBirth(page, { date: "1899-12-31", time: "12:00", city: "Москва" });
  await calculate(page);
  const range = "Дата должна быть между 1 января 1900 и сегодняшним днём";
  await expect(page.getByText(range)).toBeVisible();
  await expect(result(page)).toHaveCount(0);

  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  await page.getByRole("textbox", { name: "Дата рождения" }).fill(future.toISOString().slice(0, 10));
  await calculate(page);
  await expect(page.getByText(range)).toBeVisible();
  await expect(result(page)).toHaveCount(0);
});

test("nothing about the birth data leaves the browser: only the city search and static files are requested", async ({ page }) => {
  const requests: { method: string; url: string }[] = [];
  page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Москва" });
  requests.length = 0; // дальше — только расчёт
  await calculate(page);
  await expect(result(page)).toBeVisible();

  for (const { method, url } of requests) {
    const { pathname, search } = new URL(url);
    expect(method, url).toBe("GET");
    expect(pathname.startsWith("/_next/") || pathname === "/api/cities", url).toBe(true);
    expect(`${pathname}${search}`, url).not.toMatch(/1990|12:00|%D0%9C%D0%BE%D1%81/i);
  }
});

test("a page of an accepted batch is open, and an unknown address answers 404", async ({ page, request }) => {
  expect((await request.get("/natalnaya-karta/pluton-v-rybah")).status()).toBe(200);
  expect((await request.get("/natalnaya-karta/net-takoy-stranitsy")).status()).toBe(404);

  const response = await page.goto("/natalnaya-karta/solntse-v-ovne");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Солнце в Овне");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/natalnaya-karta\/solntse-v-ovne$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(json ?? "{}")["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual(["Article", "BreadcrumbList"]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // Приглашение ведёт к калькулятору, а в блоке «Что это значит» калькулятора есть ссылка обратно на страницу
  await page.getByRole("link", { name: "Рассчитать карту" }).click();
  await expect(page).toHaveURL(/\/natalnaya-karta$/);
});

test("the key blocks under the result link to the meaning pages", async ({ page }) => {
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Москва" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  const link = page.getByRole("link", { name: "Читать полностью" }).first();
  await expect(link).toHaveAttribute("href", "/natalnaya-karta/solntse-v-rybah");
  await link.click();
  await expect(page).toHaveURL(/\/natalnaya-karta\/solntse-v-rybah$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Солнце в Рыбах");
});

test("the wheel explains a body and an axis by tap and by buttons, and Escape clears the choice", async ({ page }) => {
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Москва" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  const card = page.getByLabel("Пояснение к колесу");
  await expect(card).toContainText("Нажмите на планету, знак или дом");

  // Кнопка под колесом: то же, что нажатие на глиф, но доступно с клавиатуры
  const sun = page.getByRole("button", { name: "Солнце", exact: true });
  await sun.click();
  await expect(card).toContainText("Солнце в Рыбах · 16°32′ · 10 дом");
  await expect(sun).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".natal-wheel .wheel-point.is-selected")).toHaveAttribute("data-body", "sun");
  await expect(page.locator(".natal-wheel .wheel-aspect.is-related").first()).toBeVisible();

  // Нажатие прямо на колесо: Луна (глиф по центру её метки)
  const moon = await page.locator('.natal-wheel .wheel-point[data-body="moon"]').boundingBox();
  if (!moon) throw new Error("нет метки Луны на колесе");
  await page.touchscreen.tap(moon.x + moon.width / 2, moon.y + moon.height / 2);
  await expect(card).toContainText("Луна в Раке");

  // Ось выбирается кнопкой, Escape снимает выбор (знак и дом по колесу проверяют модульные тесты hitTest)
  await page.getByRole("button", { name: "Асцендент" }).click();
  await expect(card).toContainText("Асцендент в Раке");
  await page.getByRole("button", { name: "Асцендент" }).press("Escape");
  await expect(card).toContainText("Нажмите на планету, знак или дом");
  await expect(page.locator(".natal-wheel .is-selected, .natal-wheel .is-related")).toHaveCount(0);

  // Выбор не уходит ни в адрес, ни в хранилище, а страница остаётся без горизонтальной прокрутки
  expect(page.url()).not.toMatch(/Солнце|sun|selection/i);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the offer under the result leads to a full example report on made-up data", async ({ page }) => {
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Москва" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  await page.getByRole("link", { name: "Посмотреть пример разбора" }).click();
  await expect(page).toHaveURL(/\/natalnaya-karta\/primer$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Пример разбора натальной карты");
  await expect(page.getByText("Демонстрационные данные: 07.03.1990, Москва")).toBeVisible();
  await expect(page.locator(".natal-report .report-chapter")).toHaveCount(9);
  await expect(page.getByRole("link", { name: "Рассчитать свою карту" })).toHaveAttribute("href", "/natalnaya-karta");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the offer asks what matters most and marks the matching chapter without reordering", async ({ page }) => {
  await fillBirth(page, { date: "1990-03-07", time: "12:00", city: "Москва" });
  await calculate(page);
  await expect(result(page)).toBeVisible();
  const love = page.getByRole("button", { name: "Любовь и отношения" });
  await love.click();
  await expect(love).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Отмечено в оглавлении: глава 3 «Любовь и ценности». Порядок глав в разборе не меняется.")).toBeVisible();
  await expect(page.locator(".natal-offer__chapter--picked")).toHaveCount(1);
  await expect(page.locator(".natal-offer__chapter--picked")).toContainText("Любовь и ценности");
  // Порядок глав прежний, выбор снимается вторым нажатием и никуда не уходит
  await expect(page.locator(".natal-offer__chapters li").nth(2)).toContainText("Любовь и ценности");
  await page.getByRole("button", { name: "Деньги и дело" }).click();
  await expect(page.locator(".natal-offer__chapter--picked")).toContainText("Дело и деньги");
  await page.getByRole("button", { name: "Деньги и дело" }).click();
  await expect(page.locator(".natal-offer__chapter--picked")).toHaveCount(0);
  expect(page.url()).not.toMatch(/love|work|topic/i);
});
