import { buildConclusionInputs, buildGuideInput, generateConclusion, generateGuideText, type GuideMoveData, type ReportWriter } from "@oracle/ai";
import { lilaCellByNumber } from "@oracle/content/lila";
import type { ConclusionJob, GuideMoveJob } from "@oracle/core";
import { getLilaConclusion, getLilaGame, saveLilaConclusion, saveLilaGuide, type Database, type LilaMoveRecord } from "@oracle/db";
import type { Logger } from "./log";

export type LilaDeps = { db: Database; writer: ReportWriter | null; log: Logger };

const toMoveData = (move: LilaMoveRecord): GuideMoveData => ({ n: move.n, roll: move.roll, from: move.from, landed: move.landed, to: move.to, transition: move.transition, note: move.note });

export async function runGuideMove(job: GuideMoveJob, deps: LilaDeps): Promise<void> {
  const game = await getLilaGame(deps.db, job.gameId);
  const skip = (reason: string) => deps.log("info", "guide skipped", { gameId: job.gameId, n: job.n, reason });
  if (!game || game.mode !== "guided" || (game.status !== "active" && game.status !== "finished")) return skip("no_guided_game");
  const index = game.moves.findIndex((move) => move.n === job.n);
  const move = game.moves[index];
  if (!move) return skip("no_move");
  if (move.guideSource !== null) return skip("already_done");
  // Пауза не открывает клетку: абзаца нет, экран не ждёт
  if (move.landed === move.from || !deps.writer) {
    await saveLilaGuide(deps.db, { gameId: game.id, n: move.n, text: null });
    return;
  }
  const input = buildGuideInput({ intention: game.intention, moves: game.moves.map(toMoveData), index, cellOf: lilaCellByNumber });
  // В лог — только id и причина: намерение и записи игрока туда не попадают
  const text = await generateGuideText(deps.writer, input, { log: (message, extra) => deps.log("warn", message, { gameId: game.id, n: move.n, ...extra }) });
  await saveLilaGuide(deps.db, { gameId: game.id, n: move.n, text });
}

export async function runConclusion(job: ConclusionJob, deps: LilaDeps): Promise<void> {
  if (await getLilaConclusion(deps.db, job.gameId)) return;
  const game = await getLilaGame(deps.db, job.gameId);
  if (!game || game.mode !== "guided" || game.status !== "finished") {
    deps.log("info", "conclusion skipped", { gameId: job.gameId, reason: !game ? "no_game" : game.mode !== "guided" ? "not_guided" : "not_finished" });
    return;
  }
  const base = buildConclusionInputs({ intention: game.intention, moves: game.moves.map(toMoveData), cellOf: lilaCellByNumber });
  const chapters = await generateConclusion(deps.writer, base, { log: (message, extra) => deps.log("warn", message, { gameId: game.id, ...extra }) });
  const { created } = await saveLilaConclusion(deps.db, { gameId: game.id, chapters });
  deps.log("info", "conclusion generated", { gameId: game.id, created, sources: chapters.map((chapter) => chapter.source) });
}
