import { describe, expect, test } from "vitest";
import { receiptsReminderJobKey, receiptsReminderWindow, RECEIPTS_REMINDER_WINDOW_MS } from "./receipts";

describe("receiptsReminderWindow", () => {
  test("delays the reminder to the end of the 10-minute window", () => {
    const start = RECEIPTS_REMINDER_WINDOW_MS * 1000;
    expect(receiptsReminderWindow(new Date(start + 60_000))).toEqual({ bucket: 1000, delaySeconds: 540 });
    expect(receiptsReminderWindow(new Date(start + 599_500))).toEqual({ bucket: 1000, delaySeconds: 1 });
  });

  test("at the exact window boundary a new window starts with a full delay", () => {
    expect(receiptsReminderWindow(new Date(RECEIPTS_REMINDER_WINDOW_MS * 1000))).toEqual({ bucket: 1000, delaySeconds: 600 });
  });

  test("payments in one window share a job key, the next window gets another", () => {
    const start = RECEIPTS_REMINDER_WINDOW_MS * 1000;
    const a = receiptsReminderWindow(new Date(start + 1_000)).bucket;
    const b = receiptsReminderWindow(new Date(start + 500_000)).bucket;
    const c = receiptsReminderWindow(new Date(start + 700_000)).bucket;
    expect(receiptsReminderJobKey({ bucket: a })).toBe(receiptsReminderJobKey({ bucket: b }));
    expect(receiptsReminderJobKey({ bucket: a })).not.toBe(receiptsReminderJobKey({ bucket: c }));
  });
});
