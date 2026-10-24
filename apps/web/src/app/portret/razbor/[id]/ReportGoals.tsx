"use client";

import { useEffect } from "react";
import { reachGoal } from "@/lib/analytics";
import { whenAnalyticsReady } from "@/lib/analytics-runtime";
import { requestPurchaseTracking } from "@/lib/purchase-analytics";

export function ReportGoals({ purchaseId, paid, opened = false, product = "matrix_report" }: { purchaseId: string; paid: boolean; opened?: boolean; product?: "matrix_report" | "natal_report" }) {
  const natal = product === "natal_report";
  useEffect(() => {
    if (paid) requestPurchaseTracking();
    if (opened) return whenAnalyticsReady(() => { reachGoal(natal ? "natal_report_opened" : "report_opened"); });
  }, [purchaseId, paid, opened, natal]);
  return null;
}
