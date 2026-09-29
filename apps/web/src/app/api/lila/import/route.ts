import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { importGame } from "@/server/lila-service";

export const POST = (request: NextRequest) =>
  lilaPost(request, async ({ user, body, deps }) => lilaResponse(await importGame(deps, { userId: user.id, payload: body.game, replace: body.replace === true })));
