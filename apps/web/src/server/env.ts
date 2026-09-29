import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  VK_CLIENT_ID: z.string().regex(/^\d+$/),
  // Платные разборы (план 2б): шлюз и отдельный переключатель показа блока продажи
  PAYMENTS: z.enum(["off", "fake", "yookassa"]).default("off"),
  YOOKASSA_SHOP_ID: z.string().regex(/^\d+$/).optional(),
  YOOKASSA_SECRET_KEY: z.string().min(1).optional(),
  PAID_REPORTS: z.enum(["on", "off"]).default("off"),
  // Платная сессия Лилы с проводником (план 3б)
  PAID_LILA: z.enum(["on", "off"]).default("off"),
  DEV_LOGIN: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

type ParsedEnv = z.infer<typeof envSchema>;
export type PaymentsConfig = { kind: "yookassa"; shopId: string; secretKey: string } | { kind: "fake" } | null;
export type AppEnv = Pick<ParsedEnv, "APP_URL" | "DATABASE_URL" | "SESSION_SECRET" | "VK_CLIENT_ID"> & { payments: PaymentsConfig; paidReports: boolean; paidLila: boolean };

// В сообщение попадают только имена переменных: значения могут быть секретами
function fail(fields: readonly string[]): never {
  throw new Error(`Invalid environment variables: ${fields.join(", ")}`);
}

function readPayments(env: ParsedEnv): PaymentsConfig {
  if (env.PAYMENTS === "off") return null;
  // Поддельная оплата — только там же, где dev-вход: локально и в сквозных тестах
  if (env.PAYMENTS === "fake") return env.NODE_ENV !== "production" && env.DEV_LOGIN === "1" ? { kind: "fake" } : fail(["PAYMENTS"]);
  const missing = [!env.YOOKASSA_SHOP_ID && "YOOKASSA_SHOP_ID", !env.YOOKASSA_SECRET_KEY && "YOOKASSA_SECRET_KEY"].filter((name): name is string => Boolean(name));
  if (missing.length > 0) fail(missing);
  return { kind: "yookassa", shopId: env.YOOKASSA_SHOP_ID!, secretKey: env.YOOKASSA_SECRET_KEY! };
}

export function readEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) fail(parsed.error.issues.map((issue) => issue.path.join(".")));
  const env = parsed.data;
  return {
    APP_URL: env.APP_URL,
    DATABASE_URL: env.DATABASE_URL,
    SESSION_SECRET: env.SESSION_SECRET,
    VK_CLIENT_ID: env.VK_CLIENT_ID,
    payments: readPayments(env),
    paidReports: env.PAID_REPORTS === "on",
    paidLila: env.PAID_LILA === "on",
  };
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  cached ??= readEnv();
  return cached;
}
