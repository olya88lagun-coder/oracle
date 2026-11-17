import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import Page from "./page";

beforeEach(() => {
  vi.useFakeTimers();
  mocks.redirect.mockClear();
});
afterEach(() => vi.useRealTimers());

test("sends the visitor to the page of the current month in Moscow", () => {
  vi.setSystemTime(new Date("2026-11-17T09:00:00Z"));
  Page();
  expect(mocks.redirect).toHaveBeenCalledWith("/lunnyy-kalendar/noyabr-2026");
});

test("counts the Moscow midnight as the next month", () => {
  vi.setSystemTime(new Date("2026-11-30T21:30:00Z"));
  Page();
  expect(mocks.redirect).toHaveBeenCalledWith("/lunnyy-kalendar/dekabr-2026");
});
