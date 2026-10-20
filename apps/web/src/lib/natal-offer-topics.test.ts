import { NATAL_CHAPTER_IDS, NATAL_CHAPTER_TITLES } from "@oracle/core/natal-report";
import { describe, expect, test } from "vitest";
import { OFFER_TOPICS, OFFER_TOPIC_QUESTION, chapterNumberFor, pickedNote, toggleTopic } from "./natal-offer-topics";

describe("offer topics", () => {
  test("every topic points to a real chapter and has its own label", () => {
    expect(OFFER_TOPICS.length).toBeGreaterThanOrEqual(5);
    for (const topic of OFFER_TOPICS) expect(NATAL_CHAPTER_IDS).toContain(topic.chapter);
    expect(new Set(OFFER_TOPICS.map((topic) => topic.label)).size).toBe(OFFER_TOPICS.length);
    expect(new Set(OFFER_TOPICS.map((topic) => topic.id)).size).toBe(OFFER_TOPICS.length);
  });

  test("the chapters named in the labels are the ones the topics lead to", () => {
    const byId = Object.fromEntries(OFFER_TOPICS.map((topic) => [topic.id, topic.chapter]));
    expect(byId.love).toBe("love");
    expect(byId.work).toBe("work");
    expect(byId.self).toBe("core");
  });

  test("never promise or predict", () => {
    const all = [OFFER_TOPIC_QUESTION, ...OFFER_TOPICS.map((topic) => topic.label)].join(" ");
    expect(all).not.toMatch(/будет|ждёт|судьб|предсказ|обязательно|всегда|никогда|удача/i);
  });
});

describe("toggleTopic", () => {
  test("picks a topic and a second tap on it releases it; another tap switches", () => {
    expect(toggleTopic(null, "love")).toBe("love");
    expect(toggleTopic("love", "love")).toBeNull();
    expect(toggleTopic("love", "work")).toBe("work");
  });
});

describe("chapterNumberFor", () => {
  const outline = NATAL_CHAPTER_IDS.map((id) => ({ id }));

  test("is the position of the chapter in the table of contents, counted from one", () => {
    expect(chapterNumberFor("love", outline)).toBe(3);
    expect(chapterNumberFor("work", outline)).toBe(5);
  });

  test("is null for no topic and for a chapter that is not in the list", () => {
    expect(chapterNumberFor(null, outline)).toBeNull();
    expect(chapterNumberFor("love", outline.filter((chapter) => chapter.id !== "love"))).toBeNull();
  });
});

describe("pickedNote", () => {
  test("names the chapter and says the order is unchanged", () => {
    expect(pickedNote(3, NATAL_CHAPTER_TITLES.love)).toBe("Отмечено в оглавлении: глава 3 «Любовь и ценности». Порядок глав в разборе не меняется.");
  });
});
