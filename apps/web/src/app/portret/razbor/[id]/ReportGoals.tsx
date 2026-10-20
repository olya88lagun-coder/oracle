"use client";

import { useEffect } from "react";
import { reachGoal, reachGoalOnce } from "@/lib/analytics";

export function ReportGoals({ purchaseId, paid, opened = false, product = "matrix_report" }: { purchaseId: string; paid: boolean; opened?: boolean; product?: "matrix_report" | "natal_report" }) {
  const natal = product === "natal_report";
  useEffect(() => {
    // Цель «оплачено» — один раз на покупку в этом браузере; отметка ставится, только когда счётчик её принял
    if (paid) reachGoalOnce(natal ? "natal_paid" : "report_paid", `oracle-report-paid:${purchaseId}`);
    if (opened) reachGoal(natal ? "natal_report_opened" : "report_opened");
  }, [purchaseId, paid, opened, natal]);
  return null;
}
