import { describe, expect, test } from "vitest";
import { LOGIN_MARK, withLoginMark } from "./login-mark";

describe("withLoginMark", () => {
  test("adds the mark to a bare path", () => {
    expect(withLoginMark("/portret")).toBe(`/portret?${LOGIN_MARK.param}=${LOGIN_MARK.value}`);
  });

  test("keeps the existing query and hash", () => {
    expect(withLoginMark("/portret?tab=1#date")).toBe("/portret?tab=1&from=login#date");
  });
});
