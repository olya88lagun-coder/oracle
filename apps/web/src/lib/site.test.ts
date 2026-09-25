import { describe, expect, test } from "vitest";
import { readSiteUrl, SITE_URL } from "./site";

describe("readSiteUrl", () => {
  test("keeps only the origin, without a trailing slash", () => {
    expect(readSiteUrl("https://oracle.example/")).toBe("https://oracle.example");
    expect(readSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  test("fails loudly when the address is missing or broken", () => {
    expect(() => readSiteUrl(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => readSiteUrl("")).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => readSiteUrl("not a url")).toThrow();
  });

  test("the site address comes from the build environment", () => {
    expect(SITE_URL).toBe("https://oracle.test");
  });
});
