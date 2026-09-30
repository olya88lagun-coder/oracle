import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Нужны PAYMENTS=fake, PAID_LILA=on и DEV_LOGIN=1 у сайта и запущенный воркер (pnpm dev:worker).
// Ключа GigaChat нет: абзацы отмечаются «none», итог собирается из запасных текстов
const INTENTION = "Почему мне трудно принять решение о работе?";

async function ownRoll(page: Page, value: number) {
  const group = page.getByRole("group", { name: "Что выпало на вашем кубике" });
  // Страница после оплаты может ещё гидратироваться: первый клик по «Играю со своим кубиком» тогда не срабатывает, поэтому повторяем
  await expect(async () => {
    if (!(await group.isVisible())) await page.getByRole("button", { name: "Играю со своим кубиком" }).click();
    await expect(group).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await group.getByRole("button", { name: `Выпало ${value}` }).click();
}

async function buy(page: Page, outcome: "Оплатить" | "Отменить") {
  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Или напишите своё намерение" }).fill(INTENTION);
  await page.getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await page.getByRole("button", { name: "Начать с проводником — 490 ₽" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  await page.getByRole("button", { name: outcome }).click();
}

test("a guest is offered to log in before buying the guide", async ({ page }) => {
  await page.goto("/lila/igra");
  await expect(page.getByRole("link", { name: "Войти и начать с проводником" })).toHaveAttribute("href", "/login?next=%2Flila%2Figra");
  await expect(page.getByRole("button", { name: "Играть без проводника" })).toBeVisible();
});

test("a signed-in player buys the guide, plays ten moves and reads the conclusion", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Проводник"));
  await buy(page, "Оплатить");
  await expect(page).toHaveURL(/\/lila\/igra$/, { timeout: 30_000 });
  await expect(page.getByText(`Намерение: ${INTENTION}`)).toBeVisible();

  await ownRoll(page, 6);
  // Ключа GigaChat нет: воркер отмечает абзац как «none», ожидание исчезает без ошибки
  await expect(page.getByText("Проводник пишет…")).toBeHidden({ timeout: 30_000 });
  for (let i = 0; i < 9; i += 1) await ownRoll(page, 1);
  await expect(page.getByText(/Ходов 10/)).toBeVisible();

  await page.getByRole("button", { name: "Завершить партию" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Завершить партию" }).click();
  await expect(page).toHaveURL(/\/portret\/lila\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 2, name: "Намерение и путь" })).toBeVisible({ timeout: 60_000 });
  for (const title of ["Что повторялось", "Что вы замечали", "Вывод и шаг на неделю"]) {
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Скачать PDF" })).toBeVisible();

  const gameId = new URL(page.url()).pathname.split("/").pop();
  const pdf = await page.request.get(`/api/lila/games/${gameId}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

  const { context: strangerContext, page: stranger } = await signIn(browser, uniqueName("Чужой"));
  expect((await stranger.goto(`/portret/lila/${gameId}`))?.status()).toBe(404);
  expect((await stranger.request.get(`/api/lila/games/${gameId}/pdf`)).status()).toBe(404);
  expect((await stranger.request.get(`/api/lila/games/${gameId}/conclusion`)).status()).toBe(404);
  await strangerContext.close();
  await context.close();
});

test("a canceled payment offers to try again and keeps the intention", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Отмена"));
  await buy(page, "Отменить");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Оплата не прошла");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Попробовать снова" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  await context.close();
});

test("a player with an active game cannot buy another one", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Занят"));
  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Или напишите своё намерение" }).fill(INTENTION);
  await page.getByRole("button", { name: "Играть без проводника" }).click();
  await expect(page.getByText(`Намерение: ${INTENTION}`)).toBeVisible();
  const response = await page.request.post("/api/purchases", {
    data: { product: "lila_session", email: "a@b.ru", intention: INTENTION },
    headers: { origin: new URL(page.url()).origin },
  });
  expect(response.status()).toBe(409);
  await context.close();
});
