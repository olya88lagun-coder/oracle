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

  test("the lunar section holds the moon pages, the months and nearby date pages, and the general one holds none of them", async () => {
    const moon = await locs("luna.xml");
    expect(moon).toContain(`${SITE_URL}/luna-segodnya`);
    const days = moon.filter((url) => /\/lunnyy-kalendar\/\d{1,2}-[a-z]+-\d{4}$/.test(url));
    expect(days.length).toBeGreaterThanOrEqual(30);
    expect(days.length).toBeLessThanOrEqual(61);
    expect(moon.every((url) => /\/(luna|luna-segodnya|lunnyy-kalendar|dni-nedeli)(\/|$)/.test(url))).toBe(true);
    expect((await locs("obshchee.xml")).some((url) => /\/(luna|luna-segodnya|lunnyy-kalendar|dni-nedeli)(\/|$)/.test(url))).toBe(false);
  });

  test("the tarot section lists hubs, spreads and major arcana only", async () => {
    const taro = await locs("taro.xml");
    expect(taro).toContain(`${SITE_URL}/taro`);
    expect(taro).toContain(`${SITE_URL}/taro/karty/mag`);
    expect(taro.some((url) => url.includes("/taro/karty/zhezly-tuz"))).toBe(false);
    expect(taro.filter((url) => url.includes("/taro/karty/"))).toHaveLength(22);
  });
});
