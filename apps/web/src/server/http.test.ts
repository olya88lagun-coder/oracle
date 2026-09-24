import { describe, expect, test } from "vitest";
import { expiredCookieOptions, isSameOrigin, sessionCookieOptions, vkStateCookieOptions } from "./http";

describe("cookie options", () => {
  test("are secure on https and relaxed on local http", () => {
    expect(sessionCookieOptions("https://oracle.test")).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2592000 });
    expect(sessionCookieOptions("http://localhost:3000").secure).toBe(false);
  });

  test("the VK state cookie is sent only to the VK routes", () => {
    expect(vkStateCookieOptions("https://oracle.test")).toMatchObject({ path: "/api/auth/vk", maxAge: 600 });
  });

  test("an expired copy keeps the path and zeroes the age", () => {
    expect(expiredCookieOptions(vkStateCookieOptions("https://oracle.test"))).toMatchObject({ path: "/api/auth/vk", maxAge: 0 });
  });
});

describe("isSameOrigin", () => {
  const post = (origin: string | null) => new Request("https://oracle.test/api/consent", { method: "POST", headers: origin ? { origin } : {} });

  test("accepts only the site's own origin", () => {
    expect(isSameOrigin(post("https://oracle.test"), "https://oracle.test")).toBe(true);
    expect(isSameOrigin(post("https://evil.test"), "https://oracle.test")).toBe(false);
    expect(isSameOrigin(post(null), "https://oracle.test")).toBe(false);
  });
});
