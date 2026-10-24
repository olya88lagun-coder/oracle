import { afterEach, describe, expect, test, vi } from "vitest";
import { isAnalyticsReady, markAnalyticsReady, onAnalyticsStateChange, setAnalyticsConsent, whenAnalyticsReady } from "./analytics-runtime";

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  setAnalyticsConsent(false);
});

describe("analytics readiness", () => {
  test("requires consent as well as SDK readiness, including a late SDK callback after rejection", () => {
    markAnalyticsReady();
    expect(isAnalyticsReady()).toBe(false);
    setAnalyticsConsent(true);
    expect(isAnalyticsReady()).toBe(false);
    markAnalyticsReady();
    expect(isAnalyticsReady()).toBe(true);
    setAnalyticsConsent(false);
    markAnalyticsReady();
    expect(isAnalyticsReady()).toBe(false);
  });

  test("waits for consent without a ten-second timeout and invokes a view only once", () => {
    const opened = vi.fn();
    cleanups.push(whenAnalyticsReady(opened));
    expect(opened).not.toHaveBeenCalled();
    setAnalyticsConsent(true);
    markAnalyticsReady();
    markAnalyticsReady();
    expect(opened).toHaveBeenCalledTimes(1);
  });

  test("handles an SDK loaded before the view subscribes", () => {
    setAnalyticsConsent(true);
    markAnalyticsReady();
    const opened = vi.fn();
    cleanups.push(whenAnalyticsReady(opened));
    expect(opened).toHaveBeenCalledTimes(1);
  });

  test("does not replay a report that was unmounted before consent", () => {
    const opened = vi.fn();
    const unmount = whenAnalyticsReady(opened);
    unmount();
    setAnalyticsConsent(true);
    markAnalyticsReady();
    expect(opened).not.toHaveBeenCalled();
  });

  test("persistent listeners see current readiness, revocation and a new SDK initialization", () => {
    const changed = vi.fn();
    cleanups.push(onAnalyticsStateChange(changed));
    setAnalyticsConsent(true);
    markAnalyticsReady();
    setAnalyticsConsent(false);
    setAnalyticsConsent(true);
    markAnalyticsReady();
    expect(changed.mock.calls.map(([ready]) => ready)).toEqual([false, true, false, true]);
  });
});
