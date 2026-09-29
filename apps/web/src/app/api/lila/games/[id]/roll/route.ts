import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { rollGame } from "@/server/lila-service";

export const POST = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  lilaPost(request, async ({ user, body, deps }) => lilaResponse(await rollGame(deps, { userId: user.id, gameId: (await params).id, customRoll: body.roll })));
