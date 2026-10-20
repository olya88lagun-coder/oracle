import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArcana, collectNatalPlanets } from "../scripts/build-arcana.mjs";
import housesRaw from "./generated/natal-houses.json";
import planetsRaw from "./generated/natal-planets.json";
import {
  ACCEPTED_HOUSE_BATCHES,
  HOUSE_BODIES,
  HOUSE_BODY_BATCH,
  HOUSE_NUMBERS,
  houseBlock,
  NATAL_HOUSE_FILES,
  NATAL_PLANETS,
  NatalHouseFormatError,
  parseNatalHouseFile,
  parseNatalPlanets,
  planetFunction,
} from "./natal-houses";
import { checkNatalHouses } from "./natal-houses-check";

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

describe("natal houses data", () => {
  test("the committed JSON matches the markdown files — run pnpm content:build after editing texts", () => {
    expect(housesRaw).toEqual(collectArcana(dir("../natal-houses")));
    expect(planetsRaw).toEqual(collectNatalPlanets(dir("../natal-planets.md")));
  });

  test("every written file has twelve blocks and all ten planets have a function", () => {
    expect(NATAL_HOUSE_FILES.length).toBeGreaterThanOrEqual(4);
    for (const file of NATAL_HOUSE_FILES) expect(Object.keys(file.blocks).map(Number).sort((a, b) => a - b), file.body).toEqual([...HOUSE_NUMBERS]);
    expect(Object.keys(NATAL_PLANETS.functions).sort()).toEqual([...HOUSE_BODIES].sort());
  });

  test("batch 1 is written: Sun, Moon, Mercury and Venus", () => {
    const bodies = NATAL_HOUSE_FILES.filter((file) => file.batch === 1).map((file) => file.body).sort();
    expect(bodies).toEqual(HOUSE_BODIES.filter((body) => HOUSE_BODY_BATCH[body] === 1).sort());
  });

  test("every written text passes the checks (volume, stop phrases, templating)", () => {
    expect(checkNatalHouses(NATAL_HOUSE_FILES, NATAL_PLANETS)).toEqual([]);
  });
});

describe("accepting batches", () => {
  test("a block is used only after its batch is accepted", () => {
    const sunAccepted = ACCEPTED_HOUSE_BATCHES.has(HOUSE_BODY_BATCH.sun);
    expect(houseBlock("sun", 10) !== undefined).toBe(sunAccepted);
    expect(planetFunction("sun") !== undefined).toBe(ACCEPTED_HOUSE_BATCHES.has(NATAL_PLANETS.batch));
    expect(houseBlock("pluto", 1)).toBeUndefined();
  });
});

describe("parsing", () => {
  const FILE = "---\nbody: sun\nbatch: 1\n---\n\n## 1 дом\n\nПервый\nабзац.\n\n## 2 дом\n\nВторой.\n";

  test("reads the header and joins the lines of a block into one paragraph", () => {
    expect(parseNatalHouseFile(FILE, "sun.md")).toEqual({ body: "sun", batch: 1, blocks: { 1: "Первый абзац.", 2: "Второй." } });
  });

  test("rejects an unknown body, a wrong section title and a missing header", () => {
    expect(() => parseNatalHouseFile(FILE.replace("body: sun", "body: chiron"), "x.md")).toThrow(NatalHouseFormatError);
    expect(() => parseNatalHouseFile(FILE.replace("## 1 дом", "## Первый"), "x.md")).toThrow(NatalHouseFormatError);
    expect(() => parseNatalHouseFile("## 1 дом\n\nТекст", "x.md")).toThrow(NatalHouseFormatError);
  });

  test("reads the planet functions by body", () => {
    expect(parseNatalPlanets("---\nbatch: 1\n---\n\n## sun\n\nЯдро.\n\n## moon\n\nЧувства.\n")).toEqual({ batch: 1, functions: { sun: "Ядро.", moon: "Чувства." } });
  });
});

describe("checkNatalHouses", () => {
  const long = "слово ".repeat(60).trim();
  const full = (body: "sun" | "moon", batch = 1) => ({ body, batch, blocks: Object.fromEntries(HOUSE_NUMBERS.map((house) => [house, `${long} дом${house}`])) });
  const functions = Object.fromEntries(HOUSE_BODIES.map((body) => [body, `функция ${body} ${"ещё ".repeat(30)}`.trim()]));

  test("complains about missing houses, a wrong batch, a stop phrase, a short block and a missing function", () => {
    const broken = { body: "sun" as const, batch: 2, blocks: { 1: "коротко", 2: `${long} вас ждёт успех` } };
    const errors = checkNatalHouses([broken], { batch: 1, functions: {} });
    expect(errors.join("\n")).toMatch(/партия 2, должна быть 1/);
    expect(errors.join("\n")).toMatch(/нужны дома 1–12/);
    expect(errors.join("\n")).toMatch(/sun, 1 дом: слов 1/);
    expect(errors.join("\n")).toMatch(/запрещённые обороты/);
    expect(errors.join("\n")).toMatch(/нет функции для «moon»/);
  });

  test("complains about templating: two blocks made of the same words", () => {
    const errors = checkNatalHouses([full("sun"), full("moon")], { batch: 1, functions });
    expect(errors.join("\n")).toMatch(/совпадают на/);
  });

  test("complains about «ты» and «карма»", () => {
    const blocks = Object.fromEntries(HOUSE_NUMBERS.map((house) => [house, `${"разные слова номер ".repeat(1)}${house} ${"ещё ".repeat(50)}твоя карма`]));
    expect(checkNatalHouses([{ body: "sun", batch: 1, blocks }], { batch: 1, functions }).join("\n")).toMatch(/«ты»\/«карма»/);
  });
});
