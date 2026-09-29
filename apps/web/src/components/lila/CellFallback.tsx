import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";

const CELLS_IN_ROW = 9;

// Запасная карточка: номер и значок вида клетки; картинка добавится пачкой без правок кода
export function CellFallback({ number, size, decorative = false }: { number: number; size: "page" | "card" | "thumb"; decorative?: boolean }) {
  const kind = number in LILA_SNAKES ? "snake" : number in LILA_ARROWS ? "arrow" : "plain";
  const row = Math.floor((number - 1) / CELLS_IN_ROW);
  return (
    <div className={`lila-fallback lila-fallback--${size} lila-fallback--row-${row}`} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": `Клетка ${number}` })}>
      <span className="lila-fallback__number">{number}</span>
      <span className="lila-fallback__mark" aria-hidden="true">
        {kind === "snake" ? "↓" : kind === "arrow" ? "↑" : "•"}
      </span>
    </div>
  );
}
