import { createPurchase, createTestDb, markPurchaseSucceeded, seedUser, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { runReceiptsReminder, type ReceiptsDeps } from "./receipts";
import type { Sender } from "./senders";

let db: Database;
let send: ReturnType<typeof vi.fn<Sender>>;
let deps: ReceiptsDeps;

beforeEach(async () => {
  db = await createTestDb();
  send = vi.fn<Sender>().mockResolvedValue("sent");
  deps = { db, send, ownerVkId: "555", appUrl: "https://tvoy-orakul.ru/", log: vi.fn() };
});

async function paid(amountKopecks: number) {
  const { userId } = await seedUser(db, { externalId: `vk-${Math.random()}` });
  const purchase = await createPurchase(db, { userId, product: "matrix_report", birthDate: "1990-01-01", receiptEmail: "buyer@example.ru", amountKopecks });
  await markPurchaseSucceeded(db, purchase.id, new Date());
}

describe("runReceiptsReminder", () => {
  test("tells the owner how many receipts wait and for how much, with a link and without buyer data", async () => {
    await paid(39_000);
    await paid(49_000);

    await runReceiptsReminder({ bucket: 1 }, deps);

    expect(send).toHaveBeenCalledTimes(1);
    const [to, text] = send.mock.calls[0]!;
    expect(to).toBe("555");
    expect(text).toContain("чеков к отправке: 2 на 880 ₽");
    expect(text).toContain("https://tvoy-orakul.ru/admin/receipts");
    expect(text).not.toContain("buyer@example.ru");
  });

  test("says nothing when every receipt is already sent, and free purchases never count", async () => {
    await paid(0);

    await runReceiptsReminder({ bucket: 1 }, deps);

    expect(send).not.toHaveBeenCalled();
  });

  test("a temporary VK failure fails the job so that it is retried", async () => {
    await paid(39_000);
    send.mockResolvedValue("failed");

    await expect(runReceiptsReminder({ bucket: 1 }, deps)).rejects.toThrow(/delivery/);
  });

  test("a refusal by VK (messages not allowed) is logged and not retried", async () => {
    await paid(39_000);
    send.mockResolvedValue("rejected");

    await expect(runReceiptsReminder({ bucket: 1 }, deps)).resolves.toBeUndefined();
    expect(deps.log).toHaveBeenCalledWith("warn", expect.stringContaining("refused"), expect.anything());
  });

  test("without the owner, the link or the sender it only logs that the reminder is not configured", async () => {
    await paid(39_000);

    for (const broken of [{ ownerVkId: null }, { appUrl: null }, { send: null }]) {
      const log = vi.fn();
      await runReceiptsReminder({ bucket: 1 }, { ...deps, ...broken, log });
      expect(log).toHaveBeenCalledWith("warn", expect.stringContaining("not configured"), expect.anything());
    }
    expect(send).not.toHaveBeenCalled();
  });
});
