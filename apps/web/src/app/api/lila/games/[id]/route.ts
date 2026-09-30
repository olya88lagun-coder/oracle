import { NextResponse, type NextRequest } from "next/server";
import { lilaDeps, lilaResponse, lilaUser } from "@/server/lila-route";
import { gameById } from "@/server/lila-service";
import { lilaPollLimiter } from "@/server/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!lilaPollLimiter.allow(user.id)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "cache-control": "no-store" } });
  return lilaResponse(await gameById(lilaDeps(), { userId: user.id, gameId: (await params).id }));
}
