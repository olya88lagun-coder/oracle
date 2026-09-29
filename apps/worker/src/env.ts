import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  // Локальная PGlite-БД путает одновременные запросы с разных соединений: там DATABASE_POOL_MAX=1, как у сайта
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(3),
  AI_PROVIDER: z.enum(["none", "gigachat"]).default("none"),
  GIGACHAT_AUTH_KEY: z.string().min(1).optional(),
  GIGACHAT_SCOPE: z.string().min(1).default("GIGACHAT_API_PERS"),
  GIGACHAT_MODEL: z.string().min(1).default("GigaChat"),
  // Сколько глав пишется одновременно: на бесплатном тарифе GigaChat — 1, на платном можно больше
  AI_CONCURRENCY: z.coerce.number().int().min(1).max(6).default(1),
});

export type AiConfig = { provider: "none" } | { provider: "gigachat"; authKey: string; scope: string; model: string };
export type WorkerEnv = { DATABASE_URL: string; poolMax: number; ai: AiConfig; aiConcurrency: number };

export function readWorkerEnv(source: Record<string, string | undefined> = process.env): WorkerEnv {
  const parsed = schema.safeParse(source);
  // В сообщение попадают только имена переменных: значения могут быть секретами
  if (!parsed.success) throw new Error(`Invalid worker environment variables: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  const env = parsed.data;
  if (env.AI_PROVIDER === "gigachat" && !env.GIGACHAT_AUTH_KEY) throw new Error("Invalid worker environment variables: GIGACHAT_AUTH_KEY");
  const ai: AiConfig =
    env.AI_PROVIDER === "gigachat" ? { provider: "gigachat", authKey: env.GIGACHAT_AUTH_KEY!, scope: env.GIGACHAT_SCOPE, model: env.GIGACHAT_MODEL } : { provider: "none" };
  return { DATABASE_URL: env.DATABASE_URL, poolMax: env.DATABASE_POOL_MAX, ai, aiConcurrency: env.AI_CONCURRENCY };
}
