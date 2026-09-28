import { getDb } from "./db";
import { getEnv, type PaymentsConfig } from "./env";
import { createFakeGateway, type FakeGateway } from "./payments/fake";
import type { PaymentGateway } from "./payments/gateway";
import { createYooKassaGateway } from "./payments/yookassa";
import type { PaymentsDeps } from "./payments-service";
import { enqueueGenerate } from "./queue";

export function createGateway(config: PaymentsConfig, p: { appUrl: string; fetchFn: typeof fetch }): PaymentGateway | null {
  if (!config) return null;
  if (config.kind === "fake") return createFakeGateway({ appUrl: p.appUrl });
  return createYooKassaGateway({ shopId: config.shopId, secretKey: config.secretKey, fetchFn: p.fetchFn });
}

// null — оплата выключена (PAYMENTS=off): маршруты покупки отвечают 404
export function paymentsDeps(): PaymentsDeps | null {
  const env = getEnv();
  const gateway = createGateway(env.payments, { appUrl: env.APP_URL, fetchFn: (input, init) => fetch(input, init) });
  if (!gateway) return null;
  return { db: getDb(), gateway, appUrl: env.APP_URL, now: () => new Date(), enqueueGenerate };
}

// Страница разбора работает и при выключенной оплате: купленные разборы остаются доступны, неоплаченные просто ждут
const DISABLED_GATEWAY: PaymentGateway = {
  createPayment: () => Promise.reject(new Error("payments are off")),
  getPayment: () => Promise.resolve(null),
};

export function purchaseViewDeps(): PaymentsDeps {
  const env = getEnv();
  return paymentsDeps() ?? { db: getDb(), gateway: DISABLED_GATEWAY, appUrl: env.APP_URL, now: () => new Date(), enqueueGenerate };
}

// Продажа видна только при включённом переключателе и настроенном шлюзе
export function salesEnabled(): boolean {
  const env = getEnv();
  return env.paidReports && env.payments !== null;
}

export function fakeGateway(): FakeGateway | null {
  const env = getEnv();
  return env.payments?.kind === "fake" ? createFakeGateway({ appUrl: env.APP_URL }) : null;
}
