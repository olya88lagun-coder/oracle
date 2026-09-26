import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/next-path";
import { loginDeps } from "@/server/deps";
import { isDevLoginEnabled } from "@/server/dev-login";
import { loginResponse } from "@/server/login-response";
import { completeLogin, giveConsent } from "@/server/login-service";

// Только для локальной разработки и E2E: VK ID не пускает на localhost.
// Dev-вход считает согласие данным, иначе сквозной сценарий пришлось бы проходить через настоящий VK ID
export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled(process.env)) return new NextResponse(null, { status: 404 });
  const deps = loginDeps();
  const name = request.nextUrl.searchParams.get("name") ?? "Разработчик";
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const outcome = await completeLogin(deps, { provider: "vk", externalId: `dev-${name}`, displayName: name }, { consent: await giveConsent(deps) }, next);
  return loginResponse(deps.env, outcome);
}
