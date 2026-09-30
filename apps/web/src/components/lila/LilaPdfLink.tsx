"use client";

import { reachGoal } from "@/lib/analytics";

export function LilaPdfLink({ gameId }: { gameId: string }) {
  return (
    <a className="button button--lavender report-pdf" href={`/api/lila/games/${gameId}/pdf`} download onClick={() => reachGoal("report_pdf_download", { kind: "lila" })}>
      Скачать PDF
    </a>
  );
}
