import { lilaCellByNumber } from "@oracle/content/lila";
import type { GameView, MoveView } from "@/lib/lila-view";

function describe(move: MoveView): string {
  if (move.wasted) return "пауза";
  const arrival = `«${lilaCellByNumber(move.to).name}»`;
  if (move.landed === move.to) return `клетка ${move.to} ${arrival}`;
  return `${move.transition === "snake" ? "змея" : "стрела"}: ${move.landed} → ${move.to} ${arrival}`;
}

export function MoveHistory({ game }: { game: GameView }) {
  if (game.moves.length === 0) return <p className="muted">Ходов пока нет.</p>;
  return (
    <ol className="lila-history" reversed>
      {[...game.moves].reverse().map((move) => (
        <li key={move.n} className="lila-history__item">
          <p>
            <strong>Ход {move.n}</strong> · выпало {move.roll}
            {move.customDie && " (свой кубик)"} · {describe(move)}
          </p>
          {move.note && <p className="muted">Запись: {move.note}</p>}
        </li>
      ))}
    </ol>
  );
}
