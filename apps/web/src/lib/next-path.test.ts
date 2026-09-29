import { describe, expect, test } from "vitest";
import { loginHref, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  test("keeps the allowed internal paths", () => {
    expect(safeNextPath("/matrica-sudby")).toBe("/matrica-sudby");
    expect(safeNextPath("/portret")).toBe("/portret");
    expect(safeNextPath("/lila/igra")).toBe("/lila/igra");
  });

  test.each([null, undefined, 42, "", "/", "https://evil.example", "//evil.example", "/matrica-sudby?x=1", "/matrica-sudby/../api", "/portret/delete", "/MATRICA-SUDBY", "/lila/igra/", "/lila/igra?x=1"])(
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
    expect(loginHref("https://evil.example")).toBe("/login");
  });
});
