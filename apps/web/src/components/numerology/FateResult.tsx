"use client";

import type { FateNumber } from "@oracle/core";
import Link from "next/link";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { sessionStore } from "@/lib/matrix-save";
import { reachNumerologyGoal } from "@/lib/numerology";
import { prepareMatrixHandoff } from "@/lib/year-arcana";

export type FateSummary = { text: string; href: string };

// Цифры даты в порядке ДД.ММ.ГГГГ — так их проще сверить с тем, что человек ввёл
const dateDigits = (iso: string): string[] => {
  const [year = "", month = "", day = ""] = iso.split("-");
  return `${day}${month}${year}`.split("");
};

export function FateResult({ iso, result, summary }: { iso: string; result: FateNumber; summary?: FateSummary }) {
  return <section className="year-result" aria-labelledby="fate-result-title">
    <div className="year-result__header stack">
      <p className="eyebrow">Ваше число судьбы</p>
      <h2 id="fate-result-title" tabIndex={-1}>Число судьбы <span className="fate-value">{result.value}</span></h2>
      <p className="year-calculation muted">{dateDigits(iso).join(" + ")} = {result.sum}{result.steps.length > 1 && <>; {result.steps.join(" → ")}</>}</p>
    </div>
    <div className="stack year-reading">
      {summary
        ? <><p>{summary.text}</p><p><Link className="touch-link" href={summary.href}>Подробнее о числе {result.value}</Link></p></>
        : <p className="muted">Описание появится позже.</p>}
      <div className="year-action stack">
        <p>Число судьбы — одна цифра. Матрица судьбы по той же дате показывает целую схему: личность, центр и задачу.</p>
        <p><Link className="button" href={MATRIX_PATH} prefetch={false} onClick={() => {
          prepareMatrixHandoff(sessionStore(), iso);
          reachNumerologyGoal("numerology_to_matrix");
        }}>Посчитать матрицу по этой дате</Link></p>
      </div>
    </div>
  </section>;
}
