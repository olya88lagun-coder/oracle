"use client";

import Link from "next/link";
import { reachGoal } from "@/lib/analytics";
import { BUTTON_CALCULATE } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";

// «Рассчитать карту» со страницы значения: ведёт к калькулятору и считает переход целью natal_to_calculator (без параметров)
export function NatalCalculatorLink() {
  return (
    <Link className="natal-button natal-button--calculate" href={NATAL_PATH} onClick={() => reachGoal("natal_to_calculator")}>
      {BUTTON_CALCULATE}
    </Link>
  );
}
