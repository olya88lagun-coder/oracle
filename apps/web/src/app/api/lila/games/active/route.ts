import { NextResponse, type NextRequest } from "next/server";
import { lilaDeps, lilaUser } from "@/server/lila-route";
import { activeGame } from "@/server/lila-service";

export async function GET(request: NextRequest) {
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, game: await activeGame(lilaDeps(), { userId: user.id }) }, { headers: { "cache-control": "no-store" } });
}
