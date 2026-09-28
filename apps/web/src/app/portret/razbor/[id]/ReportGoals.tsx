"use client";

import { useEffect } from "react";
import { reachGoal } from "@/lib/analytics";

// Цель «оплачено» — один раз на покупку в этом браузере, даже если страницу открывали несколько раз
function once(key: string): boolean {
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
  } catch {
    // Хранилище недоступно (приватный режим) — цель может засчитаться повторно, это не страшно
  }
  return true;
}

export function ReportGoals({ purchaseId, paid, opened = false }: { purchaseId: string; paid: boolean; opened?: boolean }) {
  useEffect(() => {
    if (paid && once(`oracle-report-paid:${purchaseId}`)) reachGoal("report_paid");
    if (opened) reachGoal("report_opened");
  }, [purchaseId, paid, opened]);
  return null;
}
