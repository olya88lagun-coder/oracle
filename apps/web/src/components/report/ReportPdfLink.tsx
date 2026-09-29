"use client";

import { reachGoal } from "@/lib/analytics";

export function ReportPdfLink({ purchaseId }: { purchaseId: string }) {
  return (
    <a className="button button--ghost report-pdf" href={`/api/reports/${purchaseId}/pdf`} download onClick={() => reachGoal("report_pdf_download")}>
      Скачать PDF
    </a>
  );
}
