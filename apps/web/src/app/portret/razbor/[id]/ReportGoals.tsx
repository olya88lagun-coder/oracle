"use client";

import { useEffect } from "react";
import { reachGoal } from "@/lib/analytics";
import { whenAnalyticsReady } from "@/lib/analytics-runtime";
import { requestPurchaseTracking } from "@/lib/purchase-analytics";

export function ReportGoals({ purchaseId, paid, opened = false, product = "matrix_report" }: { purchaseId: string; paid: boolean; opened?: boolean; product?: "matrix_report" | "natal_report" | "thread_report" }) {
  const goal = product === "thread_report" ? "thread_report_opened" : product === "natal_report" ? "natal_report_opened" : "report_opened";
  useEffect(() => {
    if (paid) requestPurchaseTracking();
    if (opened) return whenAnalyticsReady(() => { reachGoal(goal); });
  }, [purchaseId, paid, opened, goal]);
  return null;
}
