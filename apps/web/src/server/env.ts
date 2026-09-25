import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  VK_CLIENT_ID: z.string().regex(/^\d+$/),
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  // В сообщение попадают только имена переменных: значения могут быть секретами
  if (!parsed.success) throw new Error(`Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return parsed.data;
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  cached ??= readEnv();
  return cached;
}
