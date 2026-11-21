import { describe, expect, test } from "vitest";
import { DIARY_MAX_ENTRIES, DIARY_MAX_LENGTH, diaryStats, parseDiary, withNote } from "./moon-diary";

describe("parseDiary", () => {
  test("keeps only entries of the form date → text, and cuts a long text", () => {
    const raw = JSON.stringify({ "2026-11-20": "заметил тишину", "20.11.2026": "не дата", "2026-11-21": 5, "2026-11-22": "   ", "2026-11-23": "я".repeat(500) });
    const notes = parseDiary(raw);
    expect(Object.keys(notes)).toEqual(["2026-11-20", "2026-11-23"]);
    expect(notes["2026-11-23"]).toHaveLength(DIARY_MAX_LENGTH);
  });

  test("returns an empty diary for an empty, broken or foreign value", () => {
    for (const raw of [null, "", "{", "[1,2]", "null", '"text"']) expect(parseDiary(raw), String(raw)).toEqual({});
  });
});

describe("withNote", () => {
  test("adds and replaces a note without touching the others", () => {
    const first = withNote({}, "2026-11-20", "  первая  ");
    expect(first).toEqual({ "2026-11-20": "первая" });
    expect(withNote(first, "2026-11-20", "вторая")).toEqual({ "2026-11-20": "вторая" });
    expect(withNote(first, "2026-11-21", "ещё")).toEqual({ "2026-11-20": "первая", "2026-11-21": "ещё" });
  });

  test("an empty text deletes the note, and a wrong date is ignored", () => {
    expect(withNote({ "2026-11-20": "x" }, "2026-11-20", "  ")).toEqual({});
    const notes = { "2026-11-20": "x" };
    expect(withNote(notes, "завтра", "текст")).toBe(notes);
  });

  test("keeps the diary within its limit by dropping the oldest notes", () => {
    let notes = {};
    for (let i = 0; i < DIARY_MAX_ENTRIES + 5; i++) notes = withNote(notes, new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10), "x");
    expect(Object.keys(notes)).toHaveLength(DIARY_MAX_ENTRIES);
    expect(notes).not.toHaveProperty("2020-01-01");
  });
});

describe("diaryStats", () => {
  const notes = { "2026-11-17": "a", "2026-11-18": "b", "2026-11-19": "c", "2026-11-20": "d", "2026-10-31": "e" };

  test("counts the notes of the month and the days in a row up to today", () => {
    expect(diaryStats(notes, "2026-11-20", "2026-11")).toEqual({ inMonth: 4, streak: 4 });
  });

  test("keeps the row alive when today has no note yet: it is counted from yesterday", () => {
    expect(diaryStats(notes, "2026-11-21", "2026-11")).toEqual({ inMonth: 4, streak: 4 });
    expect(diaryStats(notes, "2026-11-22", "2026-11")).toEqual({ inMonth: 4, streak: 0 });
  });

  test("without a real date of today (on the server) it does not fail and gives a row of zero", () => {
    for (const today of ["0000-00-00", "", "сегодня", "2026-13-45"]) expect(diaryStats(notes, today, "2026-11"), today).toEqual({ inMonth: 4, streak: 0 });
  });

  test("a gap breaks the row, and the row goes over the end of a month", () => {
    expect(diaryStats({ "2026-11-01": "a", "2026-10-31": "b", "2026-10-29": "c" }, "2026-11-01", "2026-11").streak).toBe(2);
  });
});
