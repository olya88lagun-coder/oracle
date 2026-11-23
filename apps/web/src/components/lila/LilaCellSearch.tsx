"use client";

import { useEffect, useState, type ReactNode } from "react";
import { filterCells, type CellSearchItem } from "@/lib/lila-cell-search";

// Плитки клеток собраны на сервере (картинки и ссылки), здесь только отбор по запросу; запрос остаётся в браузере
export type CellTile = CellSearchItem & { readonly tile: ReactNode };

export function LilaCellSearch({ cells }: { cells: readonly CellTile[] }) {
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const shown = filterCells(cells, query);
  const searching = query.trim() !== "";
  return (
    <>
      <div className="field lila-cell-search">
        <label htmlFor="lila-cell-search">Найти клетку</label>
        <input id="lila-cell-search" className="input" type="search" autoComplete="off" placeholder="Номер, название или тема" disabled={!ready} value={query} onChange={(event) => setQuery(event.target.value)} aria-describedby="lila-cell-search-note" />
        <p id="lila-cell-search-note" className="muted">Например: «12», «зависть» или «деньги». Запрос остаётся в вашем браузере.</p>
      </div>
      <p role="status" className="muted">{searching ? (shown.length === 0 ? "Ничего не найдено. Попробуйте другое слово или номер от 1 до 72." : `Найдено клеток: ${shown.length} из ${cells.length}.`) : ""}</p>
      <ul className="lila-cell-grid">
        {shown.map((cell) => <li key={cell.number}>{cell.tile}</li>)}
      </ul>
    </>
  );
}
