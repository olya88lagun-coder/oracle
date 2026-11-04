import { describe, expect, test } from "vitest";
import { ROBOTS_DISALLOW } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import robots from "./robots";

describe("robots.txt", () => {
  test("closes only service paths (private pages carry noindex instead), points to the sitemap and has no Host directive (Yandex dropped it in 2018)", () => {
    const result = robots();
    expect(result.rules).toEqual([{ userAgent: "*", allow: "/", disallow: [...ROBOTS_DISALLOW] }]);
    expect(ROBOTS_DISALLOW).not.toContain("/portret");
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(result).not.toHaveProperty("host");
  });
});
