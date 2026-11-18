import { beforeEach, expect, test, vi } from "vitest";

const batch10 = vi.hoisted(() => ({ accepted: false }));
vi.mock("@oracle/content/numerology", async (importOriginal) =>
  (await import("../app/numerologiya/grafik-sudby/thread-fixtures")).mockThreadReportBatch(importOriginal as never, () => batch10.accepted),
);

const { threadReportReady } = await import("./numerology-pages");

beforeEach(() => {
  batch10.accepted = false;
});

test("threadReportReady is false while batch 10 is not accepted", () => {
  expect(threadReportReady()).toBe(false);
});

test("threadReportReady is true once month, past and rules of batch 10 are all accepted", () => {
  batch10.accepted = true;
  expect(threadReportReady()).toBe(true);
});
