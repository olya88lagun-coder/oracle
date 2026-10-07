import type { GenerateReportJob } from "@oracle/core";
import { createLilaGame, createTestDb, finishLilaGame, getActiveLilaGame, getLilaGameByPurchase, getPurchase, listReceiptsToSend, saveBirthDate, saveReport, seedUser, type Database } from "@oracle/db/testing";
import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from "vitest";
import { createFakeGateway, type FakeGateway } from "./payments/fake";
import type { GatewayPayment } from "./payments/gateway";
import { getLilaPurchaseView, getPurchaseView, paymentDescription, purchaseReturnPath, retryPurchase, startLilaPurchase, startPurchase, syncPayment, type PaymentsDeps } from "./payments-service";

const APP_URL = "http://localhost:3000";
const DATE = "1988-11-18";

let db: Database;
let store: Map<string, GatewayPayment>;
let gateway: FakeGateway;
let deps: PaymentsDeps;
let enqueue: Mock<(job: GenerateReportJob) => Promise<void>>;
let userId: string;
let now: Date;

beforeEach(async () => {
  db = await createTestDb();
  store = new Map();
  gateway = createFakeGateway({ appUrl: APP_URL, store });
  enqueue = vi.fn<(job: GenerateReportJob) => Promise<void>>().mockResolvedValue(undefined);
  now = new Date();
  deps = { db, gateway, appUrl: APP_URL, now: () => now, enqueueGenerate: enqueue };
  ({ userId } = await seedUser(db, { externalId: "vk-1" }));
  await saveBirthDate(db, userId, DATE, now);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const paymentOf = (url: string) => url.split("/dev/pay/")[1]!;

async function buy(email = "a@b.ru") {
  const outcome = await startPurchase(deps, { userId, email });
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.url;
}

async function pay(url: string, outcome: "succeeded" | "canceled" = "succeeded") {
  gateway.complete(paymentOf(url), outcome);
  return syncPayment(deps, paymentOf(url));
}

describe("startPurchase", () => {
  test("creates a 390 ₽ payment for the portrait date with the receipt e-mail", async () => {
    const url = await buy(" a@b.ru ");

    const payment = store.get(paymentOf(url))!;
    expect(payment.amountKopecks).toBe(39_000);
    expect(await getPurchase(db, payment.purchaseId!)).toMatchObject({ birthDate: DATE, receiptEmail: "a@b.ru", status: "pending", userId });
  });

  test.each([undefined, "", "not-an-email", 42, `${"a".repeat(250)}@b.ru`])("rejects the e-mail %s without creating anything", async (email) => {
    expect(await startPurchase(deps, { userId, email })).toEqual({ ok: false, error: "invalid_email" });
    expect(store.size).toBe(0);
  });

  test("needs a birth date in the portrait", async () => {
    const { userId: noDate } = await seedUser(db, { externalId: "vk-2" });

    expect(await startPurchase(deps, { userId: noDate, email: "a@b.ru" })).toEqual({ ok: false, error: "no_birth_date" });
  });

  test("reuses the open payment for the same date and e-mail within 30 minutes", async () => {
    const first = await buy();

    expect(await buy()).toBe(first);
    expect(store.size).toBe(1);
    now = new Date(now.getTime() + 31 * 60_000);
    expect(await buy()).not.toBe(first);
  });

  test("starts a new payment when the e-mail or the portrait date changed", async () => {
    const first = await buy();

    expect(await buy("c@d.ru")).not.toBe(first);
    await saveBirthDate(db, userId, "1990-05-14", now);
    expect(await buy("c@d.ru")).not.toBe(first);
    expect(store.size).toBe(3);
  });

  test("does not sell the same date twice", async () => {
    const url = await buy();
    const paid = await pay(url);

    expect(await startPurchase(deps, { userId, email: "a@b.ru" })).toEqual({ ok: false, error: "already_paid", purchaseId: paid!.id });
  });

  test("cancels the purchase and hides details when the gateway fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    deps = { ...deps, gateway: { ...gateway, createPayment: () => Promise.reject(new Error("503")) } };

    expect(await startPurchase(deps, { userId, email: "a@b.ru" })).toEqual({ ok: false, error: "payment_failed" });
    expect(JSON.stringify(error.mock.calls)).not.toMatch(/a@b\.ru|1988/);
  });
});

describe("syncPayment", () => {
  test("marks a paid purchase and queues one generation job", async () => {
    const url = await buy();

    const purchase = await pay(url);
    await syncPayment(deps, paymentOf(url));

    expect(purchase?.status).toBe("succeeded");
    expect(enqueue.mock.calls).toEqual([[{ purchaseId: purchase!.id }]]);
  });

  test("marks a canceled payment", async () => {
    expect((await pay(await buy(), "canceled"))?.status).toBe("canceled");
    expect(enqueue).not.toHaveBeenCalled();
  });

  test("ignores a payment whose purchase id or amount does not match", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const url = await buy();
    const id = paymentOf(url);
    store.set(id, { ...store.get(id)!, status: "succeeded", paid: true, amountKopecks: 100 });

    expect((await syncPayment(deps, id))?.status).toBe("pending");
    store.set(id, { ...store.get(id)!, amountKopecks: 39_000, purchaseId: "00000000-0000-4000-8000-000000000000" });
    expect((await syncPayment(deps, id))?.status).toBe("pending");
    expect(enqueue).not.toHaveBeenCalled();
  });

  test("returns null for an unknown payment", async () => {
    expect(await syncPayment(deps, "fake-unknown")).toBeNull();
  });

  test("a second payment of the same date is marked paid but gets no report", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = await buy();
    const second = await buy("c@d.ru");

    const firstPaid = await pay(first);
    const secondPaid = await pay(second);

    expect(secondPaid?.status).toBe("succeeded");
    expect(enqueue.mock.calls).toEqual([[{ purchaseId: firstPaid!.id }]]);
    expect(warn).toHaveBeenCalledWith("duplicate paid purchase — refund manually", { purchaseId: secondPaid!.id });
  });
});

describe("getPurchaseView", () => {
  test("hides purchases of other users and unknown ids", async () => {
    const url = await buy();
    const { userId: other } = await seedUser(db, { externalId: "vk-2" });
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;

    expect(await getPurchaseView(deps, { purchaseId, userId: other })).toBeNull();
    expect(await getPurchaseView(deps, { purchaseId: "nope", userId })).toBeNull();
  });

  test("walks from pending to generating to ready", async () => {
    const url = await buy();
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;

    expect(await getPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "pending", birthDate: DATE });
    gateway.complete(paymentOf(url), "succeeded");
    expect(await getPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "generating" });
    expect(enqueue).toHaveBeenCalledTimes(2);
    await saveReport(db, { purchaseId, chapters: [] });
    expect(await getPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "ready", duplicateOf: null });
  });

  test("keeps waiting when the gateway is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const url = await buy();
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;
    deps = { ...deps, gateway: { ...gateway, getPayment: () => Promise.reject(new Error("timeout")) } };

    expect(await getPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "pending" });
  });

  test("points a duplicate payment to the first report", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const firstUrl = await buy();
    const secondUrl = await buy("c@d.ru");
    const first = await pay(firstUrl);
    const second = await pay(secondUrl);

    expect(await getPurchaseView(deps, { purchaseId: second!.id, userId })).toMatchObject({ duplicateOf: first!.id });
  });
});

describe("retryPurchase", () => {
  test("starts a new payment for a canceled purchase with the same e-mail", async () => {
    const canceled = await pay(await buy(), "canceled");

    const outcome = await retryPurchase(deps, { userId, purchaseId: canceled!.id });

    expect(outcome.ok).toBe(true);
    const payment = store.get(paymentOf((outcome as { url: string }).url))!;
    expect(await getPurchase(db, payment.purchaseId!)).toMatchObject({ receiptEmail: "a@b.ru", birthDate: DATE, status: "pending" });
  });

  test("refuses pending, foreign and unknown purchases", async () => {
    const url = await buy();
    const pendingId = store.get(paymentOf(url))!.purchaseId!;
    const { userId: other } = await seedUser(db, { externalId: "vk-2" });

    expect(await retryPurchase(deps, { userId, purchaseId: pendingId })).toEqual({ ok: false, error: "not_found" });
    expect(await retryPurchase(deps, { userId: other, purchaseId: pendingId })).toEqual({ ok: false, error: "not_found" });
    expect(await retryPurchase(deps, { userId, purchaseId: 7 })).toEqual({ ok: false, error: "not_found" });
  });
});

describe("paymentDescription", () => {
  test("shows the e-mail and stays within the YooKassa limit of 128 characters", () => {
    expect(paymentDescription("a@b.ru")).toBe("Разбор матрицы судьбы — «Твой оракул», чек: a@b.ru");
    expect(paymentDescription(`${"x".repeat(120)}@b.ru`)).toBe("Разбор матрицы судьбы — «Твой оракул», чек: см. метаданные");
  });
});

describe("Lila session purchase", () => {
  const intention = "Что мне важно увидеть?";
  const buyLila = async (email = "a@b.ru") => {
    const outcome = await startLilaPurchase(deps, { userId, email, intention });
    if (!outcome.ok) throw new Error(outcome.error);
    return outcome.url;
  };

  test("creates a 490 ₽ payment and a game waiting for it", async () => {
    const url = await buyLila();
    const payment = store.get(paymentOf(url))!;
    expect(payment.amountKopecks).toBe(49_000);
    const purchase = await getPurchase(db, payment.purchaseId!);
    expect(purchase).toMatchObject({ product: "lila_session", birthDate: null, receiptEmail: "a@b.ru", status: "pending" });
    expect(await getLilaGameByPurchase(db, purchase!.id)).toMatchObject({ mode: "guided", status: "awaiting_payment", intention });
  });

  test("rejects a bad e-mail, a bad intention and an already active game without creating a payment", async () => {
    expect(await startLilaPurchase(deps, { userId, email: "нет", intention })).toEqual({ ok: false, error: "invalid_email" });
    expect(await startLilaPurchase(deps, { userId, email: "a@b.ru", intention: "да" })).toEqual({ ok: false, error: "invalid_intention" });
    await createLilaGame(db, { userId, intention: "Свободная" });
    expect(await startLilaPurchase(deps, { userId, email: "a@b.ru", intention })).toEqual({ ok: false, error: "active_game" });
    expect(store.size).toBe(0);
  });

  test("reuses the open payment for the same e-mail and intention within 30 minutes", async () => {
    const first = await buyLila();
    expect(await buyLila()).toBe(first);
    expect(store.size).toBe(1);
    now = new Date(now.getTime() + 31 * 60_000);
    expect(await buyLila()).not.toBe(first);
  });

  test("a new intention abandons the previous waiting game", async () => {
    const first = await buyLila();
    await startLilaPurchase(deps, { userId, email: "a@b.ru", intention: "Совсем другое намерение" });
    const firstPurchase = await getPurchase(db, store.get(paymentOf(first))!.purchaseId!);
    expect((await getLilaGameByPurchase(db, firstPurchase!.id))!.status).toBe("abandoned");
  });

  test("does not sell a second session while a paid one waits for the active game to end", async () => {
    const url = await buyLila();
    const other = await createLilaGame(db, { userId, intention: "Свободная" });
    await pay(url);
    if (!other.ok) throw new Error("no game");
    await finishLilaGame(db, { gameId: other.game.id, userId, now });
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;
    expect(await startLilaPurchase(deps, { userId, email: "a@b.ru", intention })).toEqual({ ok: false, error: "already_paid", purchaseId });
    expect((await getLilaGameByPurchase(db, purchaseId))!.status).toBe("awaiting_payment");
    expect(store.size).toBe(1);
  });

  test("a paid purchase activates the game and does not queue a report", async () => {
    const url = await buyLila();
    await pay(url);
    expect(await getActiveLilaGame(db, userId)).toMatchObject({ mode: "guided", status: "active", intention });
    expect(enqueue).not.toHaveBeenCalled();
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;
    expect(await getLilaPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "ready" });
  });

  test("a canceled payment keeps the game waiting, and «try again» gives it a new payment", async () => {
    const url = await buyLila();
    await pay(url, "canceled");
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;
    expect(await getLilaPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "canceled" });
    const retried = await retryPurchase(deps, { userId, purchaseId });
    if (!retried.ok) throw new Error(retried.error);
    expect(retried.url).not.toBe(url);
    const game = (await getLilaGameByPurchase(db, store.get(paymentOf(retried.url))!.purchaseId!))!;
    expect(game.status).toBe("awaiting_payment");
    const stranger = (await seedUser(db, { externalId: "vk-9" })).userId;
    expect(await retryPurchase(deps, { userId: stranger, purchaseId })).toEqual({ ok: false, error: "not_found" });
  });

  test("a paid purchase is «blocked» while another game is active, then becomes ready", async () => {
    const url = await buyLila();
    const other = await createLilaGame(db, { userId, intention: "Свободная" });
    await pay(url);
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;
    expect(await getLilaPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "blocked" });
    if (!other.ok) throw new Error("no game");
    await finishLilaGame(db, { gameId: other.game.id, userId, now });
    expect(await getLilaPurchaseView(deps, { purchaseId, userId })).toMatchObject({ status: "ready" });
  });

  test("hides the purchase from another user and picks the return page by product", async () => {
    const url = await buyLila();
    await pay(url);
    const purchaseId = store.get(paymentOf(url))!.purchaseId!;
    const stranger = (await seedUser(db, { externalId: "vk-8" })).userId;
    expect(await getLilaPurchaseView(deps, { purchaseId, userId: stranger })).toBeNull();
    expect(purchaseReturnPath({ id: purchaseId, product: "lila_session" })).toBe(`/lila/igra/oplata/${purchaseId}`);
    expect(purchaseReturnPath({ id: purchaseId, product: "matrix_report" })).toBe(`/portret/razbor/${purchaseId}`);
  });
});

describe("the owner gets paid services for free", () => {
  beforeEach(() => {
    deps = { ...deps, isOwner: async (id) => id === userId };
  });

  test("a report is granted at once: no payment, no e-mail, generation is queued", async () => {
    const outcome = await startPurchase(deps, { userId, email: undefined });

    if (!outcome.ok) throw new Error(outcome.error);
    const purchaseId = outcome.url.split("/").pop()!;
    expect(outcome.url).toBe(purchaseReturnPath({ id: purchaseId, product: "matrix_report" }));
    expect(store.size).toBe(0);
    expect(await getPurchase(db, purchaseId)).toMatchObject({ status: "succeeded", amountKopecks: 0, receiptEmail: null, birthDate: DATE });
    expect(enqueue).toHaveBeenCalledWith({ purchaseId });
    // Чек за 0 ₽ не нужен: покупки владелицы не попадают в список чеков к отправке
    expect(await listReceiptsToSend(db)).toEqual([]);
  });

  test("even if an e-mail comes along the owner is not charged", async () => {
    const outcome = await startPurchase(deps, { userId, email: "a@b.ru" });

    expect(outcome.ok).toBe(true);
    expect(store.size).toBe(0);
  });

  test("a second grant for the same date is refused as already paid", async () => {
    await startPurchase(deps, { userId, email: undefined });

    expect(await startPurchase(deps, { userId, email: undefined })).toMatchObject({ ok: false, error: "already_paid" });
  });

  test("a guided Lila game starts without payment and an e-mail", async () => {
    const outcome = await startLilaPurchase(deps, { userId, email: undefined, intention: "Почему мне трудно принять решение о работе?" });

    if (!outcome.ok) throw new Error(outcome.error);
    const purchaseId = outcome.url.split("/").pop()!;
    expect(outcome.url).toBe(purchaseReturnPath({ id: purchaseId, product: "lila_session" }));
    expect(store.size).toBe(0);
    expect(await getPurchase(db, purchaseId)).toMatchObject({ status: "succeeded", amountKopecks: 0, receiptEmail: null });
    expect(await getActiveLilaGame(db, userId)).toMatchObject({ mode: "guided", status: "active" });
  });

  test("another user still has to pay and give an e-mail", async () => {
    const { userId: stranger } = await seedUser(db, { externalId: "vk-stranger" });
    await saveBirthDate(db, stranger, DATE, now);

    expect(await startPurchase(deps, { userId: stranger, email: undefined })).toEqual({ ok: false, error: "invalid_email" });
    const outcome = await startPurchase(deps, { userId: stranger, email: "x@y.ru" });
    expect(outcome.ok && outcome.url.includes("/dev/pay/")).toBe(true);
  });
});

describe("the owner is reminded to send the receipt", () => {
  let remind: Mock<(now: Date) => Promise<void>>;

  beforeEach(() => {
    remind = vi.fn<(now: Date) => Promise<void>>().mockResolvedValue(undefined);
    deps = { ...deps, remindReceipts: remind };
  });

  const buyLila = async () => {
    const outcome = await startLilaPurchase(deps, { userId, email: "a@b.ru", intention: "Что мне важно увидеть?" });
    if (!outcome.ok) throw new Error(outcome.error);
    return outcome.url;
  };

  test("once per real payment, for a report and for a Lila session", async () => {
    await pay(await buy());
    expect(remind).toHaveBeenCalledTimes(1);
    expect(remind).toHaveBeenCalledWith(now);

    await pay(await buyLila());
    expect(remind).toHaveBeenCalledTimes(2);
  });

  test("not for a canceled payment, not for an unpaid purchase and not twice for the same payment", async () => {
    await pay(await buy(), "canceled");
    expect(remind).not.toHaveBeenCalled();

    const url = await buy("c@d.ru");
    await pay(url);
    await syncPayment(deps, paymentOf(url));
    expect(remind).toHaveBeenCalledTimes(1);
  });

  test("not for the owner's free purchase: there is no receipt for 0 ₽", async () => {
    deps = { ...deps, isOwner: async (id) => id === userId };

    await startPurchase(deps, { userId, email: undefined });

    expect(remind).not.toHaveBeenCalled();
  });

  test("a failing reminder never breaks the paid purchase: the report is still queued and the error is logged", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    remind.mockRejectedValue(new Error("queue is down"));

    const purchase = await pay(await buy());

    expect(purchase?.status).toBe("succeeded");
    expect(enqueue).toHaveBeenCalledWith({ purchaseId: purchase!.id });
    expect(error).toHaveBeenCalledWith("receipts reminder failed", expect.anything());
  });
});
