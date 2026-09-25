import { describe, expect, test } from "vitest";
import { clientKeyFromHeaders, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  test("allows the limit within a window and blocks the next request", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => 0 });

    expect([limiter.allow("a"), limiter.allow("a"), limiter.allow("a")]).toEqual([true, true, false]);
  });

  test("counts keys separately and opens a new window after it passes", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    limiter.allow("a");

    expect(limiter.allow("b")).toBe(true);
    now = 1000;
    expect(limiter.allow("a")).toBe(true);
  });
});

describe("clientKeyFromHeaders", () => {
  test("takes the first forwarded address and falls back to a shared key", () => {
    expect(clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKeyFromHeaders(new Headers())).toBe("unknown");
  });
});
