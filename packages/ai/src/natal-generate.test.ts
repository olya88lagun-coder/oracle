import { SCENARIO_FIELDS } from "@oracle/core";
import { computeNatalChart, NATAL_CHAPTER_IDS } from "@oracle/core/natal";
import { describe, expect, test, vi } from "vitest";
import { fallbackNatalReport } from "./natal-fallback";
import { fallbackNatalChapter, generateNatalChapter, generateNatalReport } from "./natal-generate";
import { buildNatalChapterInputs, type NatalChapterInput } from "./natal-input";
import { buildNatalPrompt, NATAL_PROSE_LIMITS } from "./natal-prompt";
import { validateNatalChapter } from "./natal-validate";
import type { Prompt, ReportWriter } from "./writer";

// Москва, 7 марта 1990, 12:00 (09:00 UTC)
const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });

const SENTENCE = "Положения этой главы могут складываться в единую картину, где одно усиливает другое, а напряжение подсказывает, на что стоит обратить внимание. ";
const prose = (paragraphs = 4, repeat = 3) => Array.from({ length: paragraphs }, () => SENTENCE.repeat(repeat).trim()).join("\n\n");
const SCENARIO = JSON.stringify({
  pattern: "Может повторяться привычка откладывать главное.",
  tension: "Напряжение — между желанием сделать и страхом ошибиться.",
  resource: "Опора — спокойная настойчивость.",
  blindSpot: "Легко не замечать собственную усталость.",
  turningPoint: "Остановиться и спросить, чего хочется на самом деле.",
  experiment: "Семь дней подряд записывать одно чувство за день.",
  question: "Где я держу себя сильнее, чем нужно?",
});

function fakeWriter(answer: (input: NatalChapterInput) => string | Promise<string>): ReportWriter & { prompts: Prompt[] } {
  const writer = {
    name: "fake",
    prompts: [] as Prompt[],
    async complete(prompt: Prompt) {
      writer.prompts.push(prompt);
      return answer(JSON.parse(prompt.user) as NatalChapterInput);
    },
  };
  return writer;
}
const goodAnswer = (input: NatalChapterInput) => (input.chapter === "scenario" ? SCENARIO : prose());
const inputOf = (id: string) => buildNatalChapterInputs(chart).find((input) => input.chapter === id)!;

describe("buildNatalChapterInputs", () => {
  const inputs = buildNatalChapterInputs(chart);

  test("gives nine inputs in the fixed order, the scenario last with a draft instead of material", () => {
    expect(inputs.map((input) => input.chapter)).toEqual([...NATAL_CHAPTER_IDS]);
    const scenario = inputs.at(-1)!;
    expect(Object.keys(scenario.scenarioDraft ?? {}).sort()).toEqual([...SCENARIO_FIELDS].sort());
    expect(scenario.material).toEqual([]);
    expect(inputs[0]?.material.length).toBeGreaterThan(0);
    expect(inputs[0]?.title).toBe("Ядро");
  });

  test("carries no birth data: neither the date, the time, the place nor the coordinates", () => {
    const json = JSON.stringify(inputs);
    for (const forbidden of ["1990", "12:00", "09:00", "Москва", "55.75", "37.61", "Europe/"]) expect(json, forbidden).not.toContain(forbidden);
  });
});

describe("buildNatalPrompt", () => {
  test("states the rules and sends the input as JSON, with different answer formats for prose and the scenario", () => {
    const core = buildNatalPrompt(inputOf("core"));
    expect(core.user).toBe(JSON.stringify(inputOf("core")));
    expect(core.system).toContain("на «вы»");
    expect(core.system).toContain("Нейтральный род");
    expect(core.system).toContain("Нельзя: предсказывать будущее");
    expect(core.system).toContain("Не упоминай дату, время и место рождения");
    expect(core.system).toContain(`${NATAL_PROSE_LIMITS.minParagraphs}–${NATAL_PROSE_LIMITS.maxParagraphs} абзацев`);
    const scenario = buildNatalPrompt(inputOf("scenario"));
    expect(scenario.system).toContain('"turningPoint"');
    expect(scenario.system).toContain("scenarioDraft");
  });
});

describe("validateNatalChapter", () => {
  const core = inputOf("core");

  test("accepts a chapter of the asked length and a complete scenario", () => {
    const ok = validateNatalChapter(core, prose());
    expect(ok.ok && ok.chapter).toMatchObject({ id: "core", source: "ai" });
    const scenario = validateNatalChapter(inputOf("scenario"), SCENARIO);
    expect(scenario.ok && Object.keys(scenario.chapter.scenario ?? {})).toHaveLength(SCENARIO_FIELDS.length);
  });

  test.each([
    ["too short", "Коротко.\n\nЕщё коротко.\n\nИ ещё.", "length"],
    ["too many paragraphs", prose(8, 2), "length"],
    ["markdown", `# Заголовок\n\n${prose(3)}`, "schema"],
    ["empty", "   ", "not_json"],
    ["a stop phrase", `${prose(3)}\n\nВас ждёт успех.`, "stop_words"],
  ])("rejects a chapter that is %s", (_title, raw, reason) => {
    expect(validateNatalChapter(core, raw)).toEqual({ ok: false, reason });
  });

  test("rejects a scenario that is not JSON, lacks a field or has a question without a question mark", () => {
    const scenario = inputOf("scenario");
    expect(validateNatalChapter(scenario, "просто текст")).toEqual({ ok: false, reason: "not_json" });
    expect(validateNatalChapter(scenario, JSON.stringify({ pattern: "а" }))).toEqual({ ok: false, reason: "schema" });
    expect(validateNatalChapter(scenario, SCENARIO.replace(/\?"/, '."'))).toEqual({ ok: false, reason: "schema" });
  });
});

describe("generateNatalChapter", () => {
  test("without a writer the chapter is assembled from the texts", () => {
    const input = inputOf("mind");
    expect(fallbackNatalChapter(input)).toEqual({ id: "mind", source: "fallback", paragraphs: [input.intro, ...input.material] });
  });

  test("returns the model's chapter when the answer passes the check", async () => {
    const writer = fakeWriter(goodAnswer);
    const chapter = await generateNatalChapter(writer, inputOf("love"));
    expect(chapter.source).toBe("ai");
    expect(writer.prompts).toHaveLength(1);
  });

  test("tries three times, logs only sizes and edges, then falls back", async () => {
    const writer = fakeWriter(() => "Секрет-ответ без абзацев.");
    const log = vi.fn();
    const chapter = await generateNatalChapter(writer, inputOf("love"), { log });
    expect(chapter.source).toBe("fallback");
    expect(writer.prompts).toHaveLength(3);
    expect(log).toHaveBeenCalledTimes(3);
    expect(log.mock.calls[0]?.[0]).toBe("natal chapter attempt rejected");
    expect(log.mock.calls[0]?.[1]).toMatchObject({ chapter: "love", attempt: 1, reason: "length" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("Секрет-ответ без абзацев.");
  });

  test("an error and a timeout of the provider fall back too, with the reason in the log", async () => {
    const log = vi.fn();
    const failing = fakeWriter(() => Promise.reject(new Error("503")));
    expect((await generateNatalChapter(failing, inputOf("mind"), { log, attempts: 2 })).source).toBe("fallback");
    const hanging = fakeWriter(() => new Promise<string>(() => undefined));
    expect((await generateNatalChapter(hanging, inputOf("mind"), { log, attempts: 1, timeoutMs: 5 })).source).toBe("fallback");
    expect(log.mock.calls.map((call) => (call[1] as { reason: string }).reason)).toEqual(["error: Error: 503", "error: Error: 503", "timeout"]);
  });
});

describe("generateNatalReport", () => {
  test("writes nine chapters, the scenario after the others and with the openings of the eight chapters", async () => {
    const writer = fakeWriter(goodAnswer);
    const chapters = await generateNatalReport(writer, chart);
    expect(chapters.map((chapter) => chapter.id)).toEqual([...NATAL_CHAPTER_IDS]);
    expect(chapters.every((chapter) => chapter.source === "ai")).toBe(true);
    const last = JSON.parse(writer.prompts.at(-1)?.user ?? "{}") as NatalChapterInput;
    expect(last.chapter).toBe("scenario");
    expect(last.previous).toHaveLength(8);
    expect(last.previous?.every((text) => text.length > 0)).toBe(true);
  });

  test("a chapter that failed is assembled from the texts, the others stay written by the model", async () => {
    const writer = fakeWriter((input) => (input.chapter === "action" ? "плохо" : goodAnswer(input)));
    const chapters = await generateNatalReport(writer, chart, { attempts: 1 });
    expect(chapters.find((chapter) => chapter.id === "action")?.source).toBe("fallback");
    expect(chapters.find((chapter) => chapter.id === "core")?.source).toBe("ai");
  });

  test("without a writer it equals the plain fallback report", async () => {
    expect(await generateNatalReport(null, chart)).toEqual(fallbackNatalReport(chart));
  });

  test("writes at most `concurrency` chapters at once", async () => {
    let running = 0;
    let peak = 0;
    const writer = fakeWriter(async (input) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return goodAnswer(input);
    });
    await generateNatalReport(writer, chart, { concurrency: 2 });
    expect(peak).toBe(2);
  });
});
