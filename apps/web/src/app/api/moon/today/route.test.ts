import { expect, test } from "vitest";
import { GET } from "./route";

test("GET returns the ribbon data as JSON with a five-minute CDN cache", async () => {
  const response = GET();
  expect(response.headers.get("cache-control")).toBe("public, s-maxage=300, stale-while-revalidate=300");
  const body = (await response.json()) as Record<string, unknown>;
  expect(Object.keys(body).sort()).toEqual(["date", "discImage", "illumination", "lunarDay", "phase", "phaseName", "sign", "signName", "waxing"]);
});
