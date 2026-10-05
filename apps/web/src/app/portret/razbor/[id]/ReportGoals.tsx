"use client";

import { useEffect } from "react";
import { reachGoal, reachGoalOnce } from "@/lib/analytics";

export function ReportGoals({ purchaseId, paid, opened = false }: { purchaseId: string; paid: boolean; opened?: boolean }) {
  useEffect(() => {
    // Цель «оплачено» — один раз на покупку в этом браузере; отметка ставится, только когда счётчик её принял
    if (paid) reachGoalOnce("report_paid", `oracle-report-paid:${purchaseId}`);
    if (opened) reachGoal("report_opened");
  }, [purchaseId, paid, opened]);
  return null;
}
