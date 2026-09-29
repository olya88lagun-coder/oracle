import { lilaCellByNumber } from "@oracle/content/lila";
import type { GameView, MoveView } from "@/lib/lila-view";

function route(move: MoveView): string {
  if (move.wasted) return "пауза";
  return move.landed === move.to ? String(move.to) : `${move.landed} → ${move.to}`;
}

function cells(move: MoveView): string {
  if (move.wasted) return `выпало ${move.roll}`;
  const arrival = lilaCellByNumber(move.to).name;
  return move.landed === move.to ? arrival : `${lilaCellByNumber(move.landed).name} · ${arrival}`;
}

export function MoveHistory({ game }: { game: GameView }) {
  if (game.moves.length === 0) return <p className="muted">Ходов пока нет.</p>;
  return (
    <ol className="lila-history" reversed>
      {[...game.moves].reverse().map((move) => (
        <li key={move.n} className="lila-history__item">
          <p className="lila-history__row">
            <strong className="lila-history__n">
              <span className="lila-history__label">Ход </span>
              {move.n}
            </strong>
            <span className="lila-history__route">
              {move.transition === "snake" ? "змея " : move.transition === "arrow" ? "стрела " : ""}
              {route(move)}
              {move.customDie && " · свой кубик"}
            </span>
            <span className="lila-history__cells">{cells(move)}</span>
          </p>
          {move.note && <p className="muted lila-history__note">Запись: {move.note}</p>}
        </li>
      ))}
    </ol>
  );
}
