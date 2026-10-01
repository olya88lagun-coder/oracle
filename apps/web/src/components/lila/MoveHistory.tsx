import { lilaCellByNumber } from "@oracle/content/lila";
import { Icon } from "@/components/Icon";
import { describeGameFacts } from "@/lib/lila-turn";
import type { GameView, MoveView } from "@/lib/lila-view";

function route(move: MoveView): string {
  if (move.wasted) return "Пауза";
  const arrival = lilaCellByNumber(move.to).name;
  return move.landed === move.to ? arrival : `${lilaCellByNumber(move.landed).name} → ${arrival}`;
}

function path(move: MoveView): string {
  if (move.wasted) return `выпало ${move.roll}`;
  const cells = move.landed === move.to ? String(move.to) : `${move.landed} → ${move.to}`;
  const kind = move.transition === "snake" ? " · змея" : move.transition === "arrow" ? " · стрела" : "";
  return `${cells}${kind}${move.customDie ? " · свой кубик" : ""}`;
}

export function MoveHistory({ game }: { game: GameView }) {
  return (
    <section className="move-history" aria-labelledby="history-title">
      <h2 id="history-title">История партии</h2>
      <p>{describeGameFacts(game)}</p>
      {game.moves.length === 0 ? (
        <p>Ходов пока нет.</p>
      ) : (
        <ol className="move-list" reversed>
          {[...game.moves].reverse().map((move) => (
            <li key={move.n} className="move-row">
              <span className="move-number">
                <span className="sr-only">Ход </span>
                {move.n}
              </span>
              <Icon name={`dice-${move.roll}` as "dice-1"} size={28} />
              <div>
                <small>{path(move)}</small>
                <h3>{route(move)}</h3>
                {move.note && <p>Запись: {move.note}</p>}
                {move.guideText && (
                  <details className="move-guide">
                    <summary>Проводник · ИИ</summary>
                    <p>{move.guideText}</p>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
