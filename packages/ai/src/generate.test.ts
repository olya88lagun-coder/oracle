import { CHAPTER_IDS } from "@oracle/core";
import { describe, expect, test, vi } from "vitest";
import { fallbackChapter } from "./fallback";
import { generateReport } from "./generate";
import { buildChapterInputs, buildScenarioInput } from "./input";
import { EXAMPLE_MATRIX, proseAnswer, SCENARIO_ANSWER } from "./testing";
import { validateChapter } from "./validate";
import type { Prompt, ReportWriter } from "./writer";

const isScenario = (prompt: Prompt) => JSON.parse(prompt.user).chapter === "scenario";

function writer(answer: (prompt: Prompt, call: number) => Promise<string>): ReportWriter & { calls: Prompt[] } {
  const calls: Prompt[] = [];
  return { name: "fake", calls, complete: async (prompt) => answer(prompt, calls.push(prompt)) };
}

const good = (prompt: Prompt) => Promise.resolve(isScenario(prompt) ? SCENARIO_ANSWER : proseAnswer());

describe("generateReport", () => {
  test("without a writer builds all seven chapters from the blocks", async () => {
    const chapters = await generateReport(null, EXAMPLE_MATRIX);

    expect(chapters.map((chapter) => chapter.id)).toEqual([...CHAPTER_IDS]);
    expect(chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
  });

  test("writes chapters with the model and the scenario last, from the openings of the others", async () => {
    const fake = writer(good);

    const chapters = await generateReport(fake, EXAMPLE_MATRIX);

    expect(chapters.every((chapter) => chapter.source === "ai")).toBe(true);
    expect(fake.calls).toHaveLength(7);
    expect(isScenario(fake.calls[6]!)).toBe(true);
    expect(JSON.parse(fake.calls[6]!.user).previous).toHaveLength(6);
  });

  test("retries a bad answer and keeps the model text when a later attempt passes", async () => {
    let core = 0;
    const fake = writer((prompt) => {
      if (JSON.parse(prompt.user).chapter !== "core") return good(prompt);
      core += 1;
      return Promise.resolve(core < 3 ? "не json" : proseAnswer());
    });

    const chapters = await generateReport(fake, EXAMPLE_MATRIX);

    expect(core).toBe(3);
    expect(chapters[0]!.source).toBe("ai");
  });

  test("falls back to the blocks after timeouts and never logs the answer text", async () => {
    const log = vi.fn();
    const slow = writer(() => new Promise(() => {}));

    const chapters = await generateReport(slow, EXAMPLE_MATRIX, { timeoutMs: 5, attempts: 2, log });

    expect(chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
    expect(log).toHaveBeenCalledWith("chapter attempt rejected", expect.objectContaining({ reason: "timeout" }));
    expect(log).toHaveBeenCalledTimes(14);
  });

  test("writes the chapters one at a time by default and in parallel when asked", async () => {
    const run = async (concurrency?: number) => {
      let active = 0;
      let peak = 0;
      const fake = writer(async (prompt) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return isScenario(prompt) ? SCENARIO_ANSWER : proseAnswer();
      });
      const chapters = await generateReport(fake, EXAMPLE_MATRIX, { concurrency });
      return { peak, ids: chapters.map((chapter) => chapter.id) };
    };

    const sequential = await run();
    const parallel = await run(3);

    expect(sequential.peak).toBe(1);
    expect(parallel.peak).toBe(3);
    expect(parallel.ids).toEqual([...CHAPTER_IDS]);
  });

  test("logs the size and edges of a rejected answer, not its text", async () => {
    const log = vi.fn();
    const rambling = writer(() => Promise.resolve("Вот ваш разбор без всякого JSON, просто длинный текст"));

    await generateReport(rambling, EXAMPLE_MATRIX, { attempts: 1, log });

    expect(log).toHaveBeenCalledWith(
      "chapter attempt rejected",
      expect.objectContaining({ reason: "not_json", chars: 53, head: "Вот ваш разбор б", tail: "то длинный текст" }),
    );
  });

  test("logs provider errors without the answer", async () => {
    const log = vi.fn();
    const broken = writer(() => Promise.reject(new Error("GigaChat responded 500")));

    await generateReport(broken, EXAMPLE_MATRIX, { attempts: 1, log });

    expect(log).toHaveBeenCalledWith("chapter attempt rejected", expect.objectContaining({ reason: "error: Error: GigaChat responded 500" }));
  });
});

describe("fallbackChapter", () => {
  test("starts with the chapter description and labels arcana in multi-arcana chapters", () => {
    const [, task, love] = buildChapterInputs(EXAMPLE_MATRIX);

    const loveChapter = fallbackChapter(love!);
    expect(loveChapter.paragraphs![0]).toBe(love!.position);
    expect(loveChapter.paragraphs![1]).toMatch(/^Точка любви — 7 Колесница\. /);
    expect(fallbackChapter(task!).paragraphs!.some((paragraph) => paragraph.startsWith("В ресурсе: "))).toBe(true);
  });

  test("builds a scenario that passes the scenario schema", () => {
    const input = buildScenarioInput(EXAMPLE_MATRIX, []);
    const chapter = fallbackChapter(input);

    expect(chapter.source).toBe("fallback");
    expect(validateChapter(input, JSON.stringify(chapter.scenario)).ok).toBe(true);
  });
});
