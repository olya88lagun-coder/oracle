import type { BirthMoment, NatalChart } from "@oracle/core/natal";
import type { BirthMomentResult, ClockKind, ZoneChoice } from "./natal-moment";
import type { NatalInput } from "./natal-input";

// Порядок расчёта карты без привязки к загрузке модулей: сами функции передаёт интерфейс, который подгружает ядро и natal-moment
// динамически, после нажатия «Рассчитать карту» (из @oracle/core/natal и natal-moment здесь только типы).

export type CalcDeps = {
  buildBirthMoment: (input: NatalInput, zoneChoice?: ZoneChoice) => BirthMomentResult;
  computeNatalChart: (moment: BirthMoment) => NatalChart;
};

export type CalcOutcome =
  | { kind: "needs-choice"; clock: "ambiguous" } // время было дважды, карта не строится, пока человек не выбрал
  | { kind: "chart"; chart: NatalChart; clock: ClockKind; correctedTime: string | null };

export function planCalculation(input: NatalInput, choice: ZoneChoice | null, deps: CalcDeps): CalcOutcome {
  const built = deps.buildBirthMoment(input, choice ?? undefined);
  if (built.clock === "ambiguous" && choice === null) return { kind: "needs-choice", clock: "ambiguous" };
  return { kind: "chart", chart: deps.computeNatalChart(built.moment), clock: built.clock, correctedTime: built.correctedTime };
}
