"use client";

import { calculateFateNumber, SQUARE_LINES, type PythagorasSquare, type SquareLineId } from "@oracle/core";
import Link from "next/link";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { sessionStore } from "@/lib/matrix-save";
import { fatePath, reachNumerologyGoal } from "@/lib/numerology";
import { SQUARE_CELL_NAMES, SQUARE_LINE_NAMES, SQUARE_LINES_PATH, squareCellPath, squareVariant } from "@/lib/pythagoras";
import { prepareMatrixHandoff } from "@/lib/year-arcana";

// Первые абзацы принятых текстов: ячейка → якорь варианта → текст; линия → текст. Полные тексты в браузер не попадают
export type SquareSummaries = {
  readonly cells: Readonly<Record<number, Readonly<Record<string, string>>>>;
  readonly lines: Readonly<Partial<Record<SquareLineId, string>>>;
};

// Классическая раскладка: первый столбец — 1, 2, 3
const ROWS = [[1, 4, 7], [2, 5, 8], [3, 6, 9]] as const;
const LATER = "Описание появится позже.";

export function PythagorasResult({ iso, square, summaries, fatePages }: { iso: string; square: PythagorasSquare; summaries: SquareSummaries; fatePages: readonly number[] }) {
  const [year = "", month = "", day = ""] = iso.split("-");
  const dateDigits = `${day}${month}${year}`;
  const [first, second, third, fourth] = square.working;
  const dayDigit = [...day].find((digit) => digit !== "0") ?? "";
  const fate = calculateFateNumber(iso, new Date())?.value;
  const cellDigits = (cell: number) => (square.counts[cell] ? String(cell).repeat(square.counts[cell]!) : "—");
  return <section className="year-result numerology-square" aria-labelledby="square-result-title">
    <div className="year-result__header stack">
      <p className="eyebrow">Ваш квадрат Пифагора</p>
      <h2 id="square-result-title" tabIndex={-1}>Квадрат Пифагора для {day}.{month}.{year}</h2>
      <ol className="year-calculation muted numerology-square__working">
        <li>Первое число: {[...dateDigits].join(" + ")} = {first}</li>
        <li>Второе: сумма цифр {first} = {second}</li>
        <li>Третье: {first} − 2 × {dayDigit} = {third}</li>
        <li>Четвёртое: сумма цифр {third} = {fourth}</li>
      </ol>
      <p className="muted">В квадрат идут цифры {dateDigits} и {first}, {second}, {third}, {fourth}, нули не учитываются.</p>
    </div>
    <table className="numerology-square__grid">
      <caption>Квадрат Пифагора: цифры по ячейкам</caption>
      <tbody>{ROWS.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}><span className="numerology-square__digits">{cellDigits(cell)}</span><span className="numerology-square__name">{cell} · {SQUARE_CELL_NAMES[cell]}</span></td>)}</tr>)}</tbody>
    </table>
    <div className="stack year-reading">
      <h3>Ячейки</h3>
      <ul className="numerology-square__cells">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => {
        const variant = squareVariant(cell, square.counts[cell] ?? 0);
        const text = summaries.cells[cell]?.[variant.anchor];
        return <li key={cell}>
          <p><strong>{SQUARE_CELL_NAMES[cell]}: {cellDigits(cell)}</strong></p>
          {text ? <><p>{text}</p><p><Link className="touch-link" href={`${squareCellPath(cell)}#${variant.anchor}`}>Подробнее: {variant.title === "Пустая ячейка" ? "пустая ячейка" : variant.title}</Link></p></> : <p className="muted">{LATER}</p>}
        </li>;
      })}</ul>
      <h3>Линии</h3>
      <ul className="numerology-square__lines">{SQUARE_LINES.map((line) => {
        const text = summaries.lines[line.id];
        const count = square.lines.find((item) => item.id === line.id)?.count ?? 0;
        return <li key={line.id} className="numerology-square__line">
          <p><strong>{SQUARE_LINE_NAMES[line.id]}</strong> ({line.cells.join("-")}): цифр {count}</p>
          {text ? <><p>{text}</p><p><Link className="touch-link" href={`${SQUARE_LINES_PATH}#${line.id}`}>Подробнее о линии</Link></p></> : <p className="muted">{LATER}</p>}
        </li>;
      })}</ul>
      <div className="year-action stack">
        <p>Первое рабочее число — сумма цифр даты, с неё же начинается число судьбы{fate !== undefined && fatePages.includes(fate) ? <>: у вас <Link href={fatePath(fate)}>число судьбы {fate}</Link></> : null}. Матрица судьбы по той же дате показывает 22 аркана: личность, центр и задачу.</p>
        <p><Link className="button" href={MATRIX_PATH} prefetch={false} onClick={() => {
          prepareMatrixHandoff(sessionStore(), iso);
          reachNumerologyGoal("pythagoras_to_matrix");
        }}>Посчитать матрицу по этой дате</Link></p>
      </div>
    </div>
  </section>;
}
