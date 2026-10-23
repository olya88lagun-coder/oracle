import { describe, expect, test } from "vitest";
import { PRIVATE_PATHS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import robots from "./robots";

describe("robots.txt", () => {
  test("keeps private pages closed, points to the sitemap and has no Host directive (Yandex dropped it in 2018)", () => {
    const result = robots();
    expect(result.rules).toEqual([{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] }]);
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(result).not.toHaveProperty("host");
  });
});
