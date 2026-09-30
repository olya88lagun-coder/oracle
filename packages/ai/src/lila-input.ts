import type { LilaCell } from "@oracle/content/lila";
import { LILA_CONCLUSION_CHAPTERS, lilaFacts, lilaQuestionIndex, lilaVisitCounts, type LilaConclusionChapterId, type LilaTransition } from "@oracle/core";

export type GuideMoveData = { n: number; roll: number; from: number; landed: number; to: number; transition: LilaTransition; note: string | null };
export type GuideCells = (number: number) => Pick<LilaCell, "name" | "about" | "questions" | "transition">;

const EARLIER_MOVES = 8;
const NOTE_CHARS_FOR_MODEL = 300;
const RECENT_NOTES = 20;
const REPEATED_CELLS = 5;

const clip = (note: string | null): string | null => (note === null ? null : note.slice(0, NOTE_CHARS_FOR_MODEL));
const wasted = (move: GuideMoveData) => move.landed === move.from;
const passage = (transition: LilaTransition) => (transition === "snake" ? ("змея" as const) : transition === "arrow" ? ("стрела" as const) : null);

// В модель уходит только то, что нужно для абзаца: намерение, названия клеток, номера ходов и записи. Ни имени, ни идентификаторов
export type GuideInput = {
  intention: string;
  earlier: { n: number; cell: string; note: string | null }[];
  current: { n: number; roll: number; cell: string; about: string; question: string; passage: "змея" | "стрела" | null; from: string | null; revisit: boolean; note: string | null };
};

export function buildGuideInput(p: { intention: string; moves: readonly GuideMoveData[]; index: number; cellOf: GuideCells }): GuideInput {
  const move = p.moves[p.index]!;
  const visits = lilaVisitCounts(p.moves.slice(0, p.index + 1).map((m) => ({ landed: m.landed, to: m.to, wasted: wasted(m) }))).get(move.to) ?? 1;
  const cell = p.cellOf(move.to);
  const earlier = p.moves
    .slice(Math.max(0, p.index - EARLIER_MOVES), p.index)
    .filter((m) => !wasted(m))
    .map((m) => ({ n: m.n, cell: p.cellOf(m.to).name, note: clip(m.note) }));
  return {
    intention: p.intention,
    earlier,
    current: {
      n: move.n,
      roll: move.roll,
      cell: cell.name,
      about: cell.about,
      question: cell.questions[lilaQuestionIndex(visits)],
      passage: passage(move.transition),
      from: move.transition === "none" ? null : p.cellOf(move.landed).name,
      revisit: visits > 1,
      note: clip(move.note),
    },
  };
}

export type ConclusionInput = {
  chapter: LilaConclusionChapterId;
  intention: string;
  facts: { moves: number; waits: number; snakes: number; arrows: number; openedCells: number; reachedGoal: boolean; stoppedAt: string | null };
  repeated: { cell: string; visits: number; about: string; question: string }[];
  notes: { n: number; cell: string; text: string }[];
  earlier: string[];
};

export function buildConclusionInputs(p: { intention: string; moves: readonly GuideMoveData[]; cellOf: GuideCells }): Record<LilaConclusionChapterId, Omit<ConclusionInput, "earlier">> {
  const facts = lilaFacts(p.moves);
  const shared = {
    intention: p.intention,
    facts: {
      moves: facts.movesCount,
      waits: facts.wastedMoves,
      snakes: facts.snakes,
      arrows: facts.arrows,
      openedCells: facts.openedCells,
      reachedGoal: facts.reachedGoal,
      stoppedAt: facts.reachedGoal || facts.finalPosition === 0 ? null : p.cellOf(facts.finalPosition).name,
    },
    repeated: facts.repeated.slice(0, REPEATED_CELLS).map((item) => {
      const cell = p.cellOf(item.cell);
      return { cell: cell.name, visits: item.visits, about: cell.about, question: cell.questions[0] };
    }),
    notes: p.moves
      .filter((move) => move.note)
      .slice(-RECENT_NOTES)
      .map((move) => ({ n: move.n, cell: p.cellOf(move.to).name, text: clip(move.note)! })),
  };
  return Object.fromEntries(LILA_CONCLUSION_CHAPTERS.map((chapter) => [chapter, { chapter, ...shared }])) as Record<LilaConclusionChapterId, Omit<ConclusionInput, "earlier">>;
}
