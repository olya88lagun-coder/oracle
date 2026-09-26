import { MATRIX_PATH } from "./arcana-paths";

// Куда можно вернуть человека после входа. Только точные внутренние пути — иначе вход стал бы открытым редиректом
export const SAFE_NEXT_PATHS = ["/portret", MATRIX_PATH] as const;
export const DEFAULT_NEXT_PATH = "/portret";

export function safeNextPath(value: unknown): string {
  return typeof value === "string" && (SAFE_NEXT_PATHS as readonly string[]).includes(value) ? value : DEFAULT_NEXT_PATH;
}

export function loginHref(next: string): string {
  const safe = safeNextPath(next);
  return safe === DEFAULT_NEXT_PATH ? "/login" : `/login?next=${encodeURIComponent(safe)}`;
}
