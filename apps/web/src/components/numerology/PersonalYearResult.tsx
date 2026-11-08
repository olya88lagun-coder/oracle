"use client";

import type { PersonalYear } from "@oracle/core";
import Link from "next/link";
import { reachNumerologyGoal } from "@/lib/numerology";
import { YEAR_PATH } from "@/lib/year-arcana";
import type { FateSummary } from "./FateResult";

const digitSum = (n: number): number => String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);

function chain(sum: number): number[] {
  const steps = [sum];
  while ((steps.at(-1) ?? 0) > 9) steps.push(digitSum(steps.at(-1) ?? 0));
  return steps;
}

export function PersonalYearResult({ iso, result, summary }: { iso: string; result: PersonalYear; summary?: FateSummary }) {
  const [, month = "", day = ""] = iso.split("-");
  const digits = `${day}${month}2027`.split("");
  const steps = chain(result.sum);
  return <section className="year-result" aria-labelledby="personal-year-result-title">
    <div className="year-result__header stack">
      <p className="eyebrow">Ваш личный год 2027</p>
      <h2 id="personal-year-result-title" tabIndex={-1}>Личный год <span className="fate-value">{result.value}</span></h2>
      <p className="year-calculation muted">{digits.join(" + ")} = {result.sum}{steps.length > 1 && <>; {steps.join(" → ")}</>}</p>
    </div>
    <div className="stack year-reading">
      {summary
        ? <><p>{summary.text}</p><p><Link className="touch-link" href={summary.href}>Подробнее о личном годе {result.value}</Link></p></>
        : <p className="muted">Описание появится позже.</p>}
      <div className="year-action stack">
        <p>Личный год показывает этап девятилетнего цикла. Аркан 2027 года по той же дате даёт образ года через 22 аркана — их можно читать вместе.</p>
        <p><Link className="button" href={YEAR_PATH} prefetch={false} onClick={() => { reachNumerologyGoal("personal_year_to_arkan"); }}>Узнать аркан 2027 года</Link></p>
      </div>
    </div>
  </section>;
}
