import { describe, expect, test } from "vitest";
import { parseNatalPage } from "./natal";
import { checkNatalPages, pageWords, shingleOverlap } from "./natal-check";

const filler = (n: number, seed = "слово") => Array.from({ length: n }, (_, i) => `${seed}${String.fromCharCode(1072 + (i % 26))}${String.fromCharCode(1072 + ((i * 7) % 26))}`).join(" ");

// Страница нужного объёма из слов, не повторяющихся между страницами с разным seed
function source(overrides: { slug?: string; name?: string; order?: number; body?: string; sign?: string; seed?: string; words?: number; drop?: string; extra?: string } = {}): string {
  const { slug = "solntse-v-ovne", name = "Солнце в Овне", order = 1, body = "sun", sign = "aries", seed = "альфа", words = 80, drop, extra = "" } = overrides;
  const para = (tag: string) => `${filler(words, `${seed}${tag}`)}.`;
  const sections: Record<string, string> = {
    "Суть": [para("а"), para("б"), para("в")].join("\n\n"),
    "Как это может проявляться": [para("г"), para("д"), para("е")].join("\n\n"),
    "Подводные камни": [para("ж"), para("з")].join("\n\n"),
    "Вопросы для размышления": ["- Что для вас значит этот первый вопрос на сегодня?", "- Что для вас значит второй вопрос в такой ситуации?", "- Что для вас значит третий вопрос про выбор?"].join("\n"),
    "Границы трактовки": `${para("и")} ${extra}`.trim(),
  };
  if (drop) delete sections[drop];
  const head = `---\norder: ${order}\nname: ${name}\nslug: ${slug}\nbody: ${body}\nsign: ${sign}\nbatch: 1\nkeywords: раз; два; три\n---\n`;
  return head + Object.entries(sections).map(([title, text]) => `\n## ${title}\n\n${text}\n`).join("");
}

describe("parseNatalPage", () => {
  test("reads the header and the five sections", () => {
    const page = parseNatalPage(source(), "001.md");
    expect(page).toMatchObject({ order: 1, slug: "solntse-v-ovne", body: "sun", sign: "aries", batch: 1 });
    expect(page.essence).toHaveLength(3);
    expect(page.manifestation).toHaveLength(3);
    expect(page.pitfalls).toHaveLength(2);
    expect(page.questions).toHaveLength(3);
    expect(page.keywords).toEqual(["раз", "два", "три"]);
  });

  test("fails loudly on a missing section, an unknown section and a bad list", () => {
    expect(() => parseNatalPage(source({ drop: "Подводные камни" }), "x.md")).toThrow(/нет секции «Подводные камни»/);
    expect(() => parseNatalPage(source().replace("## Суть", "## Что-то другое"), "x.md")).toThrow(/неизвестная секция/);
    expect(() => parseNatalPage(source().replace(/- Что для вас значит второй[^\n]*\n/, ""), "x.md")).toThrow(/от 3 до 5 вопросов/);
    expect(() => parseNatalPage("без шапки", "x.md")).toThrow(/нет шапки/);
  });
});

describe("checkNatalPages", () => {
  test("accepts a well-formed page of enough words", () => {
    expect(checkNatalPages([parseNatalPage(source(), "001.md")])).toEqual([]);
  });

  test("reports too few words", () => {
    const errors = checkNatalPages([parseNatalPage(source({ words: 20 }), "001.md")]);
    expect(errors.join("\n")).toMatch(/слов \d+, нужно не меньше 330/);
  });

  test("the ascendant needs 250 words, a planet 330", () => {
    const asc = parseNatalPage(source({ slug: "ascendent-v-ovne", name: "Асцендент в Овне", order: 25, body: "ascendant", words: 30 }), "025.md");
    expect(pageWords(asc)).toBeGreaterThanOrEqual(250);
    expect(pageWords(asc)).toBeLessThan(330);
    expect(checkNatalPages([asc])).toEqual([]);
  });

  test("reports stop phrases", () => {
    const errors = checkNatalPages([parseNatalPage(source({ extra: "Вас ждет большая перемена." }), "001.md")]);
    expect(errors.join("\n")).toMatch(/запрещённые обороты — вас ждет/);
  });

  test("reports a header that disagrees with the manifest", () => {
    const errors = checkNatalPages([parseNatalPage(source({ sign: "taurus" }), "001.md")]);
    expect(errors.join("\n")).toMatch(/шапка не совпадает с манифестом/);
  });

  test("reports a section with the wrong number of paragraphs", () => {
    const page = parseNatalPage(source().replace(/\n\n[^\n]*\.\n\n## Как/, "\n\n## Как"), "001.md");
    expect(checkNatalPages([page]).join("\n")).toMatch(/секция essence: абзацев от 3 до 4/);
  });

  test("reports two pages that share too many phrases", () => {
    const a = parseNatalPage(source(), "001.md");
    const b = parseNatalPage(source({ slug: "luna-v-ovne", name: "Луна в Овне", order: 13, body: "moon" }), "013.md");
    expect(checkNatalPages([a, b]).join("\n")).toMatch(/общих фраз/);
    const c = parseNatalPage(source({ slug: "luna-v-ovne", name: "Луна в Овне", order: 13, body: "moon", seed: "омега" }), "013.md");
    expect(checkNatalPages([a, c]).join("\n")).not.toMatch(/общих фраз/);
  });

  test("reports a repeated page", () => {
    const a = parseNatalPage(source(), "001.md");
    expect(checkNatalPages([a, a]).join("\n")).toMatch(/страница повторяется/);
  });
});

describe("shingleOverlap", () => {
  const hundred = Array.from({ length: 100 }, (_, i) => `слово${i}`).join(" ");

  test("is 1 for identical texts and under 0.05 for different ones", () => {
    expect(shingleOverlap(hundred, hundred)).toBe(1);
    const other = Array.from({ length: 100 }, (_, i) => `иное${i}`).join(" ");
    expect(shingleOverlap(hundred, other)).toBeLessThan(0.05);
  });

  test("two replaced words out of a hundred still leave the text above 0.8", () => {
    const words = hundred.split(" ");
    words[30] = "замена1";
    words[70] = "замена2";
    expect(shingleOverlap(hundred, words.join(" "))).toBeGreaterThan(0.8);
  });

  test("an empty or very short text overlaps nothing", () => {
    expect(shingleOverlap("", hundred)).toBe(0);
    expect(shingleOverlap("раз два", hundred)).toBe(0);
  });
});
