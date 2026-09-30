import { describe, expect, test } from "vitest";
import { checkArticle, type ArticleCheckContext } from "./article-check";
import { DEFAULT_BODY, sampleArticle, section } from "./article-fixture";

const context: ArticleCheckContext = {
  publicPaths: ["/", "/matrica-sudby", "/matrica-sudby/arkan-1-mag", "/sovmestimost", "/lila"],
  arcanumName: (number) => ({ 1: "Маг", 22: "Шут" })[number],
  cellName: (number) => ({ 1: "Рождение" })[number],
  today: "2026-10-05",
};

const withBody = (extra: string) => sampleArticle({}, `${DEFAULT_BODY}\n\n${extra}`);
const errorsOf = (article = sampleArticle()) => checkArticle(article, context).join("\n");

describe("checkArticle", () => {
  test("passes a well-formed article", () => {
    expect(checkArticle(sampleArticle(), context)).toEqual([]);
  });

  test("checks length, headings and the snippet fields", () => {
    expect(errorsOf(sampleArticle({}, `Коротко. [Калькулятор](/matrica-sudby)\n\n${section("А", 1)}`))).toMatch(/объём/);
    expect(errorsOf(sampleArticle({}, `Вступление [калькулятор](/matrica-sudby) и [аркан](/matrica-sudby/arkan-1-mag).\n\n${section("Один", 40)}`))).toMatch(/разделов/);
    expect(errorsOf(sampleArticle({ description: "Слишком коротко." }))).toMatch(/description/);
    expect(errorsOf(sampleArticle({ metaTitle: "Очень ".repeat(20) }))).toMatch(/metaTitle/);
    expect(errorsOf(sampleArticle({ title: "Длинный ".repeat(15) }))).toMatch(/title/);
  });

  test("rejects an introduction that announces the article", () => {
    const body = DEFAULT_BODY.replace("Предназначение в матрице судьбы —", "В этой статье мы разберём, что такое");
    expect(errorsOf(sampleArticle({}, body))).toMatch(/первый абзац/);
  });

  test("rejects stop phrases, karma and unqualified predictions", () => {
    expect(errorsOf(withBody("Вас ждёт удача."))).toMatch(/стоп/);
    expect(errorsOf(withBody("Это кармическая задача."))).toMatch(/карм/);
    expect(errorsOf(withBody("Это предсказание судьбы."))).toMatch(/предсказан/);
    expect(errorsOf(withBody("Это не предсказание, а инструмент. Здесь без предсказаний, а не предсказание."))).toBe("");
  });

  test("keeps the tone: only «вы», no gendered verbs after «вы»", () => {
    expect(errorsOf(withBody("Если ты хочешь разобраться."))).toMatch(/«вы»/);
    expect(errorsOf(withBody("Сайт «Твой оракул» помогает."))).toBe("");
    expect(errorsOf(withBody("Вы сделала первый шаг."))).toMatch(/род/);
    expect(errorsOf(withBody("Вы сделали первый шаг."))).toBe("");
  });

  test("requires internal links that exist and at least one link to a practice", () => {
    expect(errorsOf(withBody("См. [страницу](/net-takoj-stranicy)."))).toMatch(/net-takoj-stranicy/);
    const noTool = DEFAULT_BODY.replace("[рассчитать свою матрицу](/matrica-sudby)", "рассчитать матрицу").replace("[арканом Маг](/matrica-sudby/arkan-1-mag)", "арканом Маг");
    expect(errorsOf(sampleArticle({}, noTool))).toMatch(/ссылк/);
  });

  test("reports unsupported markdown instead of throwing", () => {
    expect(errorsOf(withBody("### Мелкий заголовок"))).toMatch(/неподдерживаемый/);
  });

  test("checks arcanum and cell numbers and names against the real texts", () => {
    expect(errorsOf(withBody("Аркан 23 не существует."))).toMatch(/аркан 23/i);
    expect(errorsOf(withBody("Клетка 73 не существует."))).toMatch(/клетка 73/i);
    expect(errorsOf(withBody("Аркан 1 «Шут» — ошибка."))).toMatch(/Маг/);
    expect(errorsOf(withBody("Аркан 1 «Маг» и клетка 1 «Рождение»."))).toBe("");
  });

  test("rejects a date from the future", () => {
    expect(errorsOf(sampleArticle({ date: "2026-12-31" }))).toMatch(/будущ/);
  });
});
