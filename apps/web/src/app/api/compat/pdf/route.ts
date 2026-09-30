import { NextResponse, type NextRequest } from "next/server";
import { createCompatPdf } from "@/server/compat-service";
import { getEnv } from "@/server/env";
import { isSameOrigin } from "@/server/http";
import { pdfAssetsDir } from "@/server/pdf-assets";
import { clientKeyFromHeaders, compatPdfLimiter } from "@/server/rate-limit";

const MAX_BODY_BYTES = 1024;
const NO_STORE = { "cache-control": "no-store" };
const FILENAME = "sovmestimost.pdf";

// Даты приходят в теле запроса и не логируются и не сохраняются: сервер собирает файл и забывает их
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request, getEnv().APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403, headers: NO_STORE });
  if (!compatPdfLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413, headers: NO_STORE });
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413, headers: NO_STORE });
  const body: unknown = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();

  try {
    const result = await createCompatPdf(body, new Date(), pdfAssetsDir());
    if (!result.ok) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400, headers: NO_STORE });
    return new NextResponse(new Uint8Array(result.pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${FILENAME}"`,
        "content-length": String(result.pdf.length),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    // В лог — только факт сбоя: даты и тело запроса туда не попадают
    console.error("compat pdf failed");
    return NextResponse.json({ ok: false, error: "pdf_failed" }, { status: 500, headers: NO_STORE });
  }
}
