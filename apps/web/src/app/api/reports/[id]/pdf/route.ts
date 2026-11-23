import { calculateMatrix, parseBirthDate } from "@oracle/core";
import { getReport, getThreadReport } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { loginDeps } from "@/server/deps";
import { SESSION_COOKIE } from "@/server/http";
import { getCurrentUser } from "@/server/login-service";
import { purchaseViewDeps } from "@/server/payments-deps";
import { getPurchaseView } from "@/server/payments-service";
import { pdfAssetsDir } from "@/server/pdf-assets";
import { reportPdfLimiter } from "@/server/rate-limit";
import { buildReportPdf } from "@/server/report-pdf";
import { buildThreadPdf } from "@/server/thread-pdf";

const REPORT_PDF_FILENAME = "razbor-matritsy-sudby.pdf";
const THREAD_PDF_FILENAME = "razbor-niti.pdf";

const notFound = () => NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

// PDF собирается из сохранённого разбора при каждом скачивании и отдаётся только владельцу покупки
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!reportPdfLimiter.allow(user.id)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const { id } = await params;
  const view = await getPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
  // PDF есть у разбора матрицы и разбора нити: натальный разбор в PDF не выпускается
  if (!view || (view.product !== "matrix_report" && view.product !== "thread_report") || view.status !== "ready" || view.duplicateOf) return notFound();
  const birthDate = parseBirthDate(view.birthDate, new Date());
  if (!birthDate) return notFound();
  const isThread = view.product === "thread_report";
  const assetsDir = pdfAssetsDir();

  try {
    let pdf: Buffer;
    if (isThread) {
      const report = await getThreadReport(getDb(), view.id);
      if (!report) return notFound();
      pdf = await buildThreadPdf({ birthDate: view.birthDate, chapters: report.chapters, today: report.createdAt, assetsDir });
    } else {
      const report = await getReport(getDb(), view.id);
      if (!report) return notFound();
      pdf = await buildReportPdf({ matrix: calculateMatrix(birthDate), birthDate: view.birthDate, chapters: report.chapters, assetsDir });
    }
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${isThread ? THREAD_PDF_FILENAME : REPORT_PDF_FILENAME}"`,
        "content-length": String(pdf.length),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("report pdf failed", { purchaseId: view.id, error: String(error) });
    return NextResponse.json({ ok: false, error: "pdf_failed" }, { status: 500 });
  }
}
