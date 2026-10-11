import { expect, test } from "@playwright/test";

test("an intention draft survives reload and a login detour without starting a game", async ({ page }) => {
  await page.goto("/lila/igra");
  const question = page.getByRole("textbox", { name: "Ваше намерение" });
  await page.getByLabel("Тема вопроса").selectOption("1");
  const preset = await question.inputValue();
  await page.reload();
  await expect(question).toHaveValue(preset);
  await expect(page.getByLabel("Тема вопроса")).toHaveValue("1");
  await question.fill("Как спокойнее планировать рабочую неделю?");
  await page.goto("/login?next=%2Flila%2Figra");
  await page.goto("/lila/igra");
  await expect(question).toHaveValue("Как спокойнее планировать рабочую неделю?");
  await expect(page.locator(".game-intention")).toHaveCount(0);
  await page.getByRole("button", { name: /^Играть( без проводника)?$/ }).click();
  await expect(page.locator(".game-intention")).toHaveText("Как спокойнее планировать рабочую неделю?");
  expect(await page.evaluate(() => localStorage.getItem("lila:draft:v1"))).toBeNull();
  await page.reload();
  await expect(page.locator(".game-intention")).toHaveText("Как спокойнее планировать рабочую неделю?");
});

test("clearing an intention removes its draft after reload", async ({ page }) => {
  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Ваше намерение" }).fill("Как выбрать один следующий шаг?");
  await page.getByRole("button", { name: "Очистить черновик" }).click();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Ваше намерение" })).toHaveValue("");
  expect(await page.evaluate(() => localStorage.getItem("lila:draft:v1"))).toBeNull();
});
