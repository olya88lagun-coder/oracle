import { lilaVisitCounts, type LilaTransition } from "./lila";
import type { Product } from "./report";

export const LILA_SESSION_PRODUCT = "lila_session" satisfies Product;
// Единственное место с ценой: блок покупки, оферта, контакты и платёж читают её отсюда
export const LILA_SESSION_PRICE_KOPECKS = 49_000;

export const LILA_QUEUES = { guideMove: "lila-guide-move", conclusion: "lila-conclusion" } as const;
export type GuideMoveJob = { gameId: string; n: number };
export type ConclusionJob = { gameId: string };
// Внутри задачи до двух попыток модели по 25 секунд; повтор pg-boss — только на случай сбоя базы
export const GUIDE_JOB_OPTIONS = { retryLimit: 1, retryDelay: 10, expireInSeconds: 300 } as const;
// Четыре главы по очереди, до трёх попыток на главу
export const CONCLUSION_JOB_OPTIONS = { retryLimit: 2, retryDelay: 30, retryBackoff: true, expireInSeconds: 900 } as const;

export const guideMoveJobKey = (job: GuideMoveJob): string => `lila-guide-move:${job.gameId}:${job.n}`;
export const conclusionJobKey = (job: ConclusionJob): string => `lila-conclusion:${job.gameId}`;

export const LILA_CONCLUSION_CHAPTERS = ["path", "repeats", "noticed", "outcome"] as const;
export type LilaConclusionChapterId = (typeof LILA_CONCLUSION_CHAPTERS)[number];
export const LILA_CONCLUSION_TITLES: Readonly<Record<LilaConclusionChapterId, string>> = {
  path: "Намерение и путь",
  repeats: "Что повторялось",
  noticed: "Что вы замечали",
  outcome: "Вывод и шаг на неделю",
};

export type FactsMove = { from: number; landed: number; to: number; transition: LilaTransition; note: string | null };
export type LilaFacts = {
  movesCount: number;
  wastedMoves: number;
  snakes: number;
  arrows: number;
  openedCells: number;
  reachedGoal: boolean;
  finalPosition: number;
  notesCount: number;
  repeated: { cell: number; visits: number }[];
};

const REPEATED_LIMIT = 5;
const GOAL_CELL = 68;

// Факты партии считает код, а не модель: они одинаковы для текста ИИ и для запасного итога
export function lilaFacts(moves: readonly FactsMove[]): LilaFacts {
  const visits = lilaVisitCounts(moves.map((move) => ({ landed: move.landed, to: move.to, wasted: move.landed === move.from })));
  const repeated = [...visits.entries()]
    .filter(([, count]) => count >= 2)
    .map(([cell, count]) => ({ cell, visits: count }))
    .sort((a, b) => b.visits - a.visits || a.cell - b.cell)
    .slice(0, REPEATED_LIMIT);
  const finalPosition = moves.at(-1)?.to ?? 0;
  return {
    movesCount: moves.length,
    wastedMoves: moves.filter((move) => move.landed === move.from).length,
    snakes: moves.filter((move) => move.transition === "snake").length,
    arrows: moves.filter((move) => move.transition === "arrow").length,
    openedCells: visits.size,
    reachedGoal: finalPosition === GOAL_CELL,
    finalPosition,
    notesCount: moves.filter((move) => move.note !== null && move.note !== "").length,
    repeated,
  };
}
