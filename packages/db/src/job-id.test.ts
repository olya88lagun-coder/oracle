import { describe, expect, test } from "vitest";
import { jobIdFor } from "./job-id";
import { isUuid } from "./uuid";

describe("jobIdFor", () => {
  test("turns the same key into the same uuid and different keys into different ones", () => {
    const id = jobIdFor("generate-report:p1");

    expect(isUuid(id)).toBe(true);
    expect(jobIdFor("generate-report:p1")).toBe(id);
    expect(jobIdFor("generate-report:p2")).not.toBe(id);
  });
});
