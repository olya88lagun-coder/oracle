import { calculateMatrix, parseBirthDate } from "@oracle/core";
import { getReport } from "@oracle/db";
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

const REPORT_PDF_FILENAME = "razbor-matritsy-sudby.pdf";

const notFound = () => NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

// PDF собирается из сохранённого разбора при каждом скачивании и отдаётся только владельцу покупки
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!reportPdfLimiter.allow(user.id)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const { id } = await params;
  const view = await getPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
  if (!view || view.status !== "ready" || view.duplicateOf) return notFound();
  const birthDate = parseBirthDate(view.birthDate, new Date());
  const report = birthDate ? await getReport(getDb(), view.id) : null;
  if (!birthDate || !report) return notFound();

  try {
    const pdf = await buildReportPdf({ matrix: calculateMatrix(birthDate), birthDate: view.birthDate, chapters: report.chapters, assetsDir: pdfAssetsDir() });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${REPORT_PDF_FILENAME}"`,
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
