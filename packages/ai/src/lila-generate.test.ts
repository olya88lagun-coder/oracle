import { LILA_CONCLUSION_CHAPTERS } from "@oracle/core";
import { describe, expect, test, vi } from "vitest";
import { generateConclusion, generateGuideText } from "./lila-generate";
import { buildConclusionInputs, type GuideInput } from "./lila-input";
import type { Prompt, ReportWriter } from "./writer";

const SENTENCE = "На этой клетке может проявляться тема, которая связана с вашим вопросом о работе и решении. ";
const GUIDE = `На клетке Рождение ${SENTENCE.repeat(3)}`.trim();
const CHAPTER = `Клетка 1 остаётся в поле зрения. ${SENTENCE.repeat(4).trim()}\n\nКаждый вечер в 21:00, за столом, запишите одну строку. ${SENTENCE.repeat(3).trim()}`;

const input: GuideInput = {
  intention: "Что мне важно?",
  earlier: [],
  current: { n: 1, roll: 6, cell: "Рождение", about: "О клетке.", question: "Вопрос?", passage: null, from: null, revisit: false, note: null },
};

function writer(answer: (prompt: Prompt) => Promise<string>): ReportWriter & { calls: Prompt[] } {
  const calls: Prompt[] = [];
  return {
    name: "fake",
    calls,
    complete: (prompt) => {
      calls.push(prompt);
      return answer(prompt);
    },
  };
}

describe("generateGuideText", () => {
  test("gives nothing without a writer", async () => {
    expect(await generateGuideText(null, input)).toBeNull();
  });

  test("after a rejection the next prompt carries the hint", async () => {
    let attempt = 0;
    const fake = writer(async () => {
      attempt += 1;
      return attempt === 1 ? `${GUIDE} Вы не достойны большего.` : GUIDE;
    });
    expect(await generateGuideText(fake, input)).toBe(GUIDE);
    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[0]?.system).not.toContain("Прошлый ответ отклонён");
    expect(fake.calls[1]?.system).toContain("Прошлый ответ отклонён");
    expect(fake.calls[1]!.system.indexOf("350–550")).toBeLessThan(fake.calls[1]!.system.indexOf("Прошлый ответ отклонён"));
  });

  test("returns a valid paragraph", async () => {
    const fake = writer(async () => GUIDE);
    expect(await generateGuideText(fake, input)).toBe(GUIDE);
    expect(fake.calls).toHaveLength(1);
  });

  test("tries twice on a bad answer, then gives up without logging the answer", async () => {
    const log = vi.fn();
    const fake = writer(async () => "**Секретный** ответ");
    expect(await generateGuideText(fake, input, { log })).toBeNull();
    expect(fake.calls).toHaveLength(2);
    expect(JSON.stringify(log.mock.calls)).not.toContain("Секретный");
  });

  test("gives up on a timeout", async () => {
    const fake = writer(() => new Promise<string>(() => undefined));
    expect(await generateGuideText(fake, input, { timeoutMs: 20, attempts: 1 })).toBeNull();
  });

  test("survives a failing provider", async () => {
    const fake = writer(async () => {
      throw new Error("boom");
    });
    expect(await generateGuideText(fake, input, { attempts: 1 })).toBeNull();
  });
});

describe("generateConclusion", () => {
  const cellOf = (n: number) => ({ name: `Клетка ${n}`, about: "О.", questions: ["В1?", "В2?", "В3?"] as const, transition: null });
  const base = buildConclusionInputs({ intention: "Что мне важно?", moves: [{ n: 1, roll: 6, from: 0, landed: 1, to: 1, transition: "none", note: null }], cellOf });

  test("writes four chapters from the model and feeds the last one the openings of the others", async () => {
    const fake = writer(async () => CHAPTER);
    const chapters = await generateConclusion(fake, base);
    expect(chapters.map((c) => [c.id, c.source])).toEqual(LILA_CONCLUSION_CHAPTERS.map((id) => [id, "ai"]));
    const last = JSON.parse(fake.calls.at(-1)!.user);
    expect(last.chapter).toBe("outcome");
    expect(last.earlier).toHaveLength(3);
    expect(last.earlier[0]).toContain("Клетка 1");
  });

  test("falls back chapter by chapter when the model fails, and entirely without a writer", async () => {
    const failing = writer(async () => "Коротко.");
    const chapters = await generateConclusion(failing, base, { attempts: 1 });
    expect(chapters.every((c) => c.source === "fallback")).toBe(true);
    expect((await generateConclusion(null, base)).map((c) => c.source)).toEqual(["fallback", "fallback", "fallback", "fallback"]);
  });
});
