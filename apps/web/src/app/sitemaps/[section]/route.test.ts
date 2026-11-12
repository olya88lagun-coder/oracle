import { describe, expect, test } from "vitest";
import { SITE_URL } from "@/lib/site";
import sitemap from "../../sitemap";
import { GET, generateStaticParams } from "./route";

const locs = async (section: string) => {
  const response = await GET(new Request(`http://localhost/sitemaps/${section}`), { params: Promise.resolve({ section }) });
  return [...(await response.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]!);
};

describe("section sitemaps", () => {
  test("together list every address of sitemap.xml exactly once", async () => {
    const all = (await Promise.all(generateStaticParams().map(({ section }) => locs(section)))).flat();
    expect(all.sort()).toEqual(sitemap().map((entry) => entry.url).sort());
  });

  test("each section holds only its own pages", async () => {
    expect((await locs("lila.xml")).every((url) => url.includes("/lila"))).toBe(true);
    expect(await locs("matrica.xml")).toContain(`${SITE_URL}/arkan-na-god/arkan-19-solnce`);
    expect(await locs("obshchee.xml")).toContain(SITE_URL);
  });
});
