import { describe, expect, test } from "vitest";
import { validateConclusionChapter, validateGuideText } from "./lila-validate";

const SENTENCE = "На этой клетке может проявляться тема, которая связана с вашим вопросом о работе и решении. ";

describe("validateGuideText", () => {
  test("accepts one plain paragraph of the right length", () => {
    const text = SENTENCE.repeat(3).trim();
    expect(validateGuideText(text)).toEqual({ ok: true, text });
  });

  test("strips a code fence and surrounding whitespace", () => {
    const text = SENTENCE.repeat(3).trim();
    expect(validateGuideText(`\`\`\`\n${text}\n\`\`\``)).toEqual({ ok: true, text });
  });

  test("rejects empty, too short, too long, several paragraphs, markdown and JSON", () => {
    expect(validateGuideText("   ")).toEqual({ ok: false, reason: "empty" });
    expect(validateGuideText("Коротко.")).toEqual({ ok: false, reason: "length" });
    expect(validateGuideText(SENTENCE.repeat(12))).toEqual({ ok: false, reason: "length" });
    expect(validateGuideText(`${SENTENCE.repeat(2)}\n\n${SENTENCE}\n\n${SENTENCE}`)).toEqual({ ok: false, reason: "format" });
    expect(validateGuideText(`**Важно.** ${SENTENCE.repeat(3)}`)).toEqual({ ok: false, reason: "format" });
    expect(validateGuideText(`{"text": "${SENTENCE.repeat(3)}"}`)).toEqual({ ok: false, reason: "format" });
  });

  test("rejects prediction phrases", () => {
    expect(validateGuideText(`${SENTENCE.repeat(3)} Вас ждет успех.`)).toEqual({ ok: false, reason: "stop_words" });
  });
});

describe("validateConclusionChapter", () => {
  // Два абзаца должны набрать 600 знаков, поэтому каждый — четыре предложения
  const paragraph = SENTENCE.repeat(4).trim();

  test("accepts two to four paragraphs of the right total length", () => {
    expect(validateConclusionChapter(`${paragraph}\n\n${paragraph}`)).toEqual({ ok: true, paragraphs: [paragraph, paragraph] });
  });

  test("rejects one paragraph, too little text, markdown lists and stop phrases", () => {
    expect(validateConclusionChapter(paragraph)).toMatchObject({ ok: false });
    expect(validateConclusionChapter("Коротко.\n\nЕщё коротко.")).toEqual({ ok: false, reason: "length" });
    expect(validateConclusionChapter(`- пункт\n\n${paragraph}\n\n${paragraph}`)).toEqual({ ok: false, reason: "format" });
    expect(validateConclusionChapter(`${paragraph}\n\n${paragraph} Это неизбежно.`)).toEqual({ ok: false, reason: "stop_words" });
  });
});
