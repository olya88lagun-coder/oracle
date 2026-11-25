import { describe, expect, test } from "vitest";
import { taroCardFromParam, taroCardImage, taroCardPath, taroCardPathsForSitemap, taroShareUrl } from "./taro-paths";

describe("taro paths", () => {
  test("builds card paths and image names for three sizes", () => {
    const mag = taroCardFromParam("mag")!;
    expect(taroCardPath(mag)).toBe("/taro/karty/mag");
    expect(taroCardImage(mag)).toBe("/taro/02-mag.webp");
    expect(taroCardImage(mag, "card")).toBe("/taro/02-mag-480.webp");
    expect(taroCardImage(mag, "thumb")).toBe("/taro/02-mag-160.webp");
  });

  test("the sitemap lists only the 22 major arcana", () => {
    const paths = taroCardPathsForSitemap();
    expect(paths).toHaveLength(22);
    expect(paths).toContain("/taro/karty/mag");
    expect(paths).toContain("/taro/karty/shut");
    expect(paths).not.toContain("/taro/karty/zhezly-tuz");
  });

  test("resolves only known slugs in exact form", () => {
    expect(taroCardFromParam("zhezly-tuz")?.name).toBe("Туз Жезлов");
    for (const bad of ["net", "Mag", "mag/", "", "arkan-1-mag"]) expect(taroCardFromParam(bad)).toBeNull();
  });

  test("the share link tells the source and carries no dates", () => {
    const url = taroShareUrl(taroCardFromParam("mag")!);
    expect(url).toContain("/taro/karty/mag");
    expect(url).toContain("utm_source=share");
    expect(url).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
