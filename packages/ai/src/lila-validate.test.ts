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

describe("filler and hypothetical-notes checks", () => {
  const body = SENTENCE.repeat(4).trim();
  const chapter = (first: string) => `${first} ${body}

${body}`;
  test("two connectives are rejected, one is fine", () => {
    expect(validateConclusionChapter(chapter("Стоит заметить, что вы вернулись. Таким образом, тема важна.")).ok).toBe(false);
    expect(validateConclusionChapter(chapter("Стоит заметить, что вы вернулись.")).ok).toBe(true);
  });
  test("a sentence about what would be with fewer notes is rejected", () => {
    const text = chapter("Если бы заметок было меньше или их не было совсем, можно было бы напомнить о дневнике.");
    expect(validateConclusionChapter(text)).toEqual({ ok: false, reason: "filler" });
  });
  test("the guide paragraph gets the same check", () => {
    expect(validateGuideText(`${SENTENCE.repeat(3)} Стоит заметить, это важно. Таким образом, вывод ясен.`)).toEqual({ ok: false, reason: "filler" });
  });
  test("a claim that the player is unworthy is rejected", () => {
    expect(validateConclusionChapter(chapter("Это глубинное убеждение, что вы не достойны большего."))).toEqual({ ok: false, reason: "overreach" });
    expect(validateGuideText(`${SENTENCE.repeat(3)} Вы недостойны большего дохода.`)).toEqual({ ok: false, reason: "overreach" });
  });
  test("drops a closing recap the way the natal report does", () => {
    const recap = "Таким образом, эти ходы складываются в один вывод и ничего нового не добавляют.";
    const result = validateConclusionChapter(`${body}\n\n${body}\n\n${recap}`);
    expect(result.ok && result.paragraphs).toHaveLength(2);
    expect(result.ok && result.paragraphs?.join(" ")).not.toContain("Таким образом");
  });
});
