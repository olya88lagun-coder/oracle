import { describe, expect, test } from "vitest";
import { loginHref, SAFE_NEXT_PATHS, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  test("keeps the allowed internal paths", () => {
    expect(safeNextPath("/matrica-sudby")).toBe("/matrica-sudby");
    expect(safeNextPath("/portret")).toBe("/portret");
    expect(safeNextPath("/lila/igra")).toBe("/lila/igra");
    expect(safeNextPath("/natalnaya-karta")).toBe("/natalnaya-karta");
  });

  test.each([null, undefined, 42, "", "/", "https://evil.example", "//evil.example", "/matrica-sudby?x=1", "/matrica-sudby/../api", "/portret/delete", "/MATRICA-SUDBY", "/lila/igra/", "/lila/igra?x=1", "/natalnaya-karta?date=1990-03-07", "/natalnaya-karta/", "/natalnaya-karta/../api", "/NATALNAYA-KARTA"])(
    "falls back to the portrait for %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/portret");
    },
  );
});

describe("loginHref", () => {
  test("adds next only when it differs from the default", () => {
    expect(loginHref("/portret")).toBe("/login");
    expect(loginHref("/matrica-sudby")).toBe("/login?next=%2Fmatrica-sudby");
    expect(loginHref("/lila/igra")).toBe("/login?next=%2Flila%2Figra");
    expect(loginHref("/natalnaya-karta")).toBe("/login?next=%2Fnatalnaya-karta");
    expect(loginHref("https://evil.example")).toBe("/login");
  });
});

describe("SAFE_NEXT_PATHS", () => {
  test("is the exact allow-list of bare internal paths", () => {
    expect([...SAFE_NEXT_PATHS]).toEqual(["/portret", "/matrica-sudby", "/lila/igra", "/natalnaya-karta"]);
  });
});
