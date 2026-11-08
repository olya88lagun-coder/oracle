import { calculatePythagorasSquare, SQUARE_LINES, type PythagorasSquare, type SquareLineId } from "@oracle/core";
import { DATE_ERROR } from "./matrix-save";

// Совместимость по квадрату Пифагора (docs/superpowers/specs/2026-11-09-pythagoras-compat-design.md)
export { acceptedPairPaths, PYTHAGORAS_COMPAT_PATH } from "./pythagoras";

export type CellRelation = "empty" | "close" | "apart";
export type LineLevel = "low" | "mid" | "high";
export const LINE_LEVEL_NAMES: Readonly<Record<LineLevel, string>> = { low: "мало", mid: "средне", high: "много" };

export function cellRelation(you: number, partner: number): CellRelation {
  if (you === 0 && partner === 0) return "empty";
  return you > 0 && partner > 0 && Math.abs(you - partner) <= 1 ? "close" : "apart";
}

// Пороги по распределению дат 1950–2010: около 21 % / 55 % / 24 %
export const lineLevel = (count: number): LineLevel => (count <= 2 ? "low" : count <= 5 ? "mid" : "high");

export type PairCell = { readonly cell: number; readonly you: number; readonly partner: number; readonly relation: CellRelation };
export type PairLine = {
  readonly id: SquareLineId;
  readonly you: number;
  readonly partner: number;
  readonly youLevel: LineLevel;
  readonly partnerLevel: LineLevel;
  readonly relation: "same" | "differ";
};
export type PairComparison = { readonly you: PythagorasSquare; readonly partner: PythagorasSquare; readonly cells: readonly PairCell[]; readonly lines: readonly PairLine[] };
export type PairOutcome =
  | { ok: true; key: string; youIso: string; partnerIso: string; pair: PairComparison }
  | { ok: false; field: "you" | "partner"; error: string };

// «Темперамент» первым, дальше порядок SQUARE_LINES
const LINE_ORDER = [...SQUARE_LINES].sort((a, b) => Number(b.id === "temperament") - Number(a.id === "temperament"));

function compare(you: PythagorasSquare, partner: PythagorasSquare): PairComparison {
  const count = (square: PythagorasSquare, id: SquareLineId) => square.lines.find((line) => line.id === id)?.count ?? 0;
  return {
    you,
    partner,
    cells: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => {
      const a = you.counts[cell] ?? 0;
      const b = partner.counts[cell] ?? 0;
      return { cell, you: a, partner: b, relation: cellRelation(a, b) };
    }),
    lines: LINE_ORDER.map(({ id }) => {
      const a = count(you, id);
      const b = count(partner, id);
      return { id, you: a, partner: b, youLevel: lineLevel(a), partnerLevel: lineLevel(b), relation: lineLevel(a) === lineLevel(b) ? "same" : "differ" };
    }),
  };
}

export function pairOutcome(youIso: string, partnerIso: string, today: Date): PairOutcome {
  const you = calculatePythagorasSquare(youIso, today);
  if (!you) return { ok: false, field: "you", error: DATE_ERROR };
  const partner = calculatePythagorasSquare(partnerIso, today);
  if (!partner) return { ok: false, field: "partner", error: DATE_ERROR };
  return { ok: true, key: `${youIso}|${partnerIso}`, youIso, partnerIso, pair: compare(you, partner) };
}

