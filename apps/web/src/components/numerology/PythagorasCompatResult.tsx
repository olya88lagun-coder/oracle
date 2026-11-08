import type { SquareLineId } from "@oracle/core";
import Link from "next/link";
import { COMPAT_PATH } from "@/lib/compat";
import { PYTHAGORAS_PATH, SQUARE_CELL_NAMES, SQUARE_LINE_NAMES, SQUARE_LINES_PATH, squareCellPath, squareVariant } from "@/lib/pythagoras";
import { LINE_LEVEL_NAMES, type CellRelation, type PairCell, type PairOutcome } from "@/lib/pythagoras-compat";
import { SquareWorking } from "./SquareWorking";

// Первые абзацы разделов партии 8: ячейка → отношение → текст; линия → «один / разный уровень» → текст
export type PairTexts = {
  readonly cells: Readonly<Record<number, Partial<Record<CellRelation, string>>>>;
  readonly lines: Readonly<Partial<Record<SquareLineId, Partial<Record<"same" | "differ", string>>>>>;
};

const ROWS = [[1, 4, 7], [2, 5, 8], [3, 6, 9]] as const;
const LATER = "Описание появится позже.";
const RELATION_LABELS: Readonly<Record<CellRelation, string>> = { empty: "у обоих пусто", close: "похоже", apart: "по-разному" };

const digits = (cell: number, count: number) => (count ? String(cell).repeat(count) : "—");
const variantLabel = (cell: number, count: number) => (count ? squareVariant(cell, count).title : "пустая ячейка");
const variantHref = (cell: number, count: number) => `${squareCellPath(cell)}#${squareVariant(cell, count).anchor}`;
const dateOf = (iso: string) => iso.split("-").reverse().join(".");

function CellCard({ item, texts }: { item: PairCell; texts: PairTexts }) {
  const text = texts.cells[item.cell]?.[item.relation];
  return <li className="numerology-pair__cell">
    <p><strong>{item.cell} · {SQUARE_CELL_NAMES[item.cell]}</strong>: у вас {digits(item.cell, item.you)}, у партнёра {digits(item.cell, item.partner)}</p>
    {text ? <p>{text}</p> : <p className="muted">{LATER}</p>}
    <p className="numerology-pair__variants">
      <Link className="touch-link numerology-pair__you" href={variantHref(item.cell, item.you)}>Ваш вариант: {variantLabel(item.cell, item.you)}</Link>
      <Link className="touch-link numerology-pair__partner" href={variantHref(item.cell, item.partner)}>Вариант партнёра: {variantLabel(item.cell, item.partner)}</Link>
    </p>
  </li>;
}

export function PythagorasCompatResult({ outcome, texts }: { outcome: Extract<PairOutcome, { ok: true }>; texts: PairTexts }) {
  const { pair, youIso, partnerIso } = outcome;
  const similar = pair.cells.filter((item) => item.relation !== "apart");
  const different = pair.cells.filter((item) => item.relation === "apart");
  const byCell = new Map(pair.cells.map((item) => [item.cell, item]));
  return <section className="year-result numerology-pair" aria-labelledby="pair-result-title">
    <div className="year-result__header stack">
      <p className="eyebrow">Совместимость по квадрату Пифагора</p>
      <h2 id="pair-result-title" tabIndex={-1}>Ваши квадраты Пифагора</h2>
      <p className="muted">Вы — {dateOf(youIso)}, партнёр — {dateOf(partnerIso)}.</p>
    </div>
    <ul className="numerology-pair__legend" aria-label="Обозначения">
      <li className="numerology-pair__you">Вы</li>
      <li className="numerology-pair__partner">Партнёр</li>
      {(["close", "apart", "empty"] as const).map((relation) => <li key={relation} className={`numerology-pair__relation numerology-pair__relation--${relation}`}>{RELATION_LABELS[relation]}</li>)}
    </ul>
    <table className="numerology-pair__grid">
      <caption>Общий квадрат пары: цифры по ячейкам</caption>
      <tbody>{ROWS.map((row) => <tr key={row[0]}>{row.map((cell) => {
        const item = byCell.get(cell)!;
        return <td key={cell} className={`numerology-pair__tile numerology-pair__tile--${item.relation}`}>
          <span className="numerology-square__name">{cell} · {SQUARE_CELL_NAMES[cell]}</span>
          <span className="numerology-pair__digits numerology-pair__you">Вы: {digits(cell, item.you)}</span>
          <span className="numerology-pair__digits numerology-pair__partner">Партнёр: {digits(cell, item.partner)}</span>
          <span className="numerology-pair__relation">{RELATION_LABELS[item.relation]}</span>
        </td>;
      })}</tr>)}</tbody>
    </table>
    <details className="numerology-pair__working">
      <summary>Как посчитано</summary>
      <div className="numerology-pair__working-people">
        <div className="stack"><h3>Вы</h3><SquareWorking iso={youIso} square={pair.you} /></div>
        <div className="stack"><h3>Партнёр</h3><SquareWorking iso={partnerIso} square={pair.partner} /></div>
      </div>
    </details>
    <div className="stack year-reading">
      {similar.length ? <>
        <h3>Где вы похожи</h3>
        <ul className="numerology-pair__cells">{similar.map((item) => <CellCard key={item.cell} item={item} texts={texts} />)}</ul>
      </> : <p>Во всех ячейках у вас заметные различия.</p>}
      {different.length ? <>
        <h3>Где различаетесь</h3>
        <ul className="numerology-pair__cells">{different.map((item) => <CellCard key={item.cell} item={item} texts={texts} />)}</ul>
      </> : <p>Во всех ячейках у вас похожая картина.</p>}
      <h3>Линии пары</h3>
      <ul className="numerology-pair__lines">{pair.lines.map((line) => {
        const text = texts.lines[line.id]?.[line.relation];
        return <li key={line.id} className="numerology-pair__line">
          <p><strong>{SQUARE_LINE_NAMES[line.id]}</strong>: у вас {line.you} ({LINE_LEVEL_NAMES[line.youLevel]}), у партнёра {line.partner} ({LINE_LEVEL_NAMES[line.partnerLevel]})</p>
          {text ? <p>{text}</p> : <p className="muted">{LATER}</p>}
          <p><Link className="touch-link" href={`${SQUARE_LINES_PATH}#${line.id}`}>Подробнее о линии</Link></p>
        </li>;
      })}</ul>
      <div className="year-action stack">
        <p><Link className="touch-link" href={PYTHAGORAS_PATH}>Квадрат Пифагора по одной дате</Link></p>
        <p><Link className="touch-link" href={COMPAT_PATH}>Совместимость по матрице судьбы</Link></p>
      </div>
    </div>
  </section>;
}
