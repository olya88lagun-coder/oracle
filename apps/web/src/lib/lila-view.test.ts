import { describe, expect, test } from "vitest";
import { normalizeIntention, normalizeNote, toGameView, toMoveView } from "./lila-view";

const move = (n: number, from: number, landed: number, to: number, roll: number, transition: "none" | "snake" | "arrow" = "none") => ({ n, roll, from, landed, to, transition, customDie: false, note: null });

describe("toMoveView", () => {
  test("marks the entry, a wasted move and the goal", () => {
    expect(toMoveView(move(1, 0, 1, 1, 6))).toMatchObject({ entered: true, wasted: false, reachedGoal: false });
    expect(toMoveView(move(1, 0, 0, 0, 3))).toMatchObject({ entered: false, wasted: true });
    expect(toMoveView(move(9, 67, 68, 68, 1))).toMatchObject({ reachedGoal: true, wasted: false });
  });
});

describe("toGameView", () => {
  const game = { id: "g", mode: "free" as const, status: "active" as const, intention: "Что мне важно?", position: 8, movesCount: 3, moves: [move(1, 0, 1, 1, 6), move(2, 1, 6, 6, 5), move(3, 6, 12, 8, 6, "snake")] };

  test("keeps the moves and computes what the player may do", () => {
    const view = toGameView(game);
    expect(view.moves).toHaveLength(3);
    expect(view).toMatchObject({ canRoll: true, canFinish: false });
  });

  test("a finished game can neither roll nor finish again", () => {
    expect(toGameView({ ...game, status: "finished" })).toMatchObject({ canRoll: false, canFinish: false });
  });

  test("the goal allows finishing and forbids rolling", () => {
    expect(toGameView({ ...game, position: 68 })).toMatchObject({ canRoll: false, canFinish: true });
  });
});

describe("normalizeIntention", () => {
  test("trims and collapses whitespace", () => {
    expect(normalizeIntention("  Что   мне\nважно? ")).toBe("Что мне важно?");
  });
  test("rejects non-strings, too short and too long texts", () => {
    expect(normalizeIntention(5)).toBeNull();
    expect(normalizeIntention("да")).toBeNull();
    expect(normalizeIntention("а".repeat(301))).toBeNull();
    expect(normalizeIntention("а".repeat(300))).not.toBeNull();
  });
});

describe("normalizeNote", () => {
  test("empty means no note, a long note is invalid", () => {
    expect(normalizeNote("   ")).toBeNull();
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote("я".repeat(501))).toBe("invalid");
    expect(normalizeNote(" Заметила. ")).toBe("Заметила.");
    expect(normalizeNote(7)).toBe("invalid");
  });
});

describe("guide paragraphs in the game view", () => {
  test("a guided move without a paragraph yet is pending; a wasted move, a saved paragraph or a free game is not", () => {
    const base = { id: "g", intention: "Что мне важно?", position: 1, movesCount: 2, status: "active" as const };
    const real = { n: 1, roll: 6, from: 0, landed: 1, to: 1, transition: "none" as const, customDie: false, note: null };
    const wasted = { ...real, n: 2, roll: 3, from: 1, landed: 1, to: 1 };
    const guided = toGameView({ ...base, mode: "guided", moves: [{ ...real, guideSource: null }, { ...wasted, guideSource: null }] });
    expect(guided.moves.map((m) => m.guidePending)).toEqual([true, false]);
    expect(toGameView({ ...base, mode: "guided", moves: [{ ...real, guideSource: "ai", guideText: "Абзац." }] }).moves[0]).toMatchObject({ guidePending: false, guideText: "Абзац." });
    expect(toGameView({ ...base, mode: "guided", moves: [{ ...real, guideSource: "none" }] }).moves[0]).toMatchObject({ guidePending: false, guideText: null });
    expect(toGameView({ ...base, mode: "free", moves: [{ ...real, guideSource: null }] }).moves[0]!.guidePending).toBe(false);
  });
});
