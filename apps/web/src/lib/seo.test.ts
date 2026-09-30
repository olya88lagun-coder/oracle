import { describe, expect, test } from "vitest";
import { jsonLdScript, lilaGameJsonLd, PRIVATE_PATHS, PUBLIC_PATHS, publicMetadata, SITE_PREVIEW_IMAGE, websiteJsonLd } from "./seo";

describe("publicMetadata", () => {
  test("opens the page for indexing with a canonical address", () => {
    const metadata = publicMetadata({ title: "Контакты", description: "Как связаться", path: "/contacts" });

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({ canonical: "/contacts" });
    expect(metadata.title).toBe("Контакты");
    expect(metadata.openGraph).toMatchObject({ title: "Контакты", url: "/contacts", locale: "ru_RU", siteName: "Твой оракул" });
  });

  test("a page with a picture shares it in link previews", () => {
    const metadata = publicMetadata({ title: "Сила", description: "d", path: "/p", image: { url: "/arcana/11-sila.webp", alt: "Аркан 11 «Сила»" } });

    expect(metadata.openGraph).toMatchObject({ images: [{ url: "/arcana/11-sila.webp", width: 960, height: 960, alt: "Аркан 11 «Сила»" }] });
  });

  test("the shared site picture keeps its own size and a large card; a page without a picture gets a small card", () => {
    const withImage = publicMetadata({ title: "Главная", description: "d", path: "/", image: SITE_PREVIEW_IMAGE });
    expect(withImage.openGraph).toMatchObject({ images: [{ url: "/hero.webp", width: 2400, height: 1028 }] });
    expect(withImage.twitter).toMatchObject({ card: "summary_large_image", images: ["/hero.webp"] });
    expect(publicMetadata({ title: "Контакты", description: "d", path: "/contacts" }).twitter).toMatchObject({ card: "summary" });
  });

  test("an absolute title skips the site-wide template", () => {
    expect(publicMetadata({ title: "Главная", description: "d", path: "/", absoluteTitle: true }).title).toEqual({ absolute: "Главная" });
  });
});

describe("paths", () => {
  test("public and private paths never overlap", () => {
    for (const path of PUBLIC_PATHS) {
      expect(PRIVATE_PATHS.some((prefix) => path.startsWith(prefix))).toBe(false);
    }
  });

  test("the home page is public and the portrait is private", () => {
    expect(PUBLIC_PATHS).toContain("/");
    expect(PRIVATE_PATHS).toContain("/portret");
  });

  test("documents are public", () => {
    expect(PUBLIC_PATHS).toEqual(expect.arrayContaining(["/contacts", "/privacy", "/consent"]));
  });

  test("the Lila landing and all 72 cell pages are public, the game itself is not", () => {
    expect(PUBLIC_PATHS).toContain("/lila");
    expect(PUBLIC_PATHS).toContain("/lila/kletki/12-zavist");
    expect(PUBLIC_PATHS.filter((path) => path.startsWith("/lila/kletki/"))).toHaveLength(72);
    expect(PUBLIC_PATHS).not.toContain("/lila/igra");
    expect(PRIVATE_PATHS).toContain("/lila/igra");
  });

  test("the tarot pages are public: index, card of the day and all 78 cards", () => {
    expect(PUBLIC_PATHS).toEqual(expect.arrayContaining(["/taro", "/taro/karta-dnya", "/taro/karty/mag", "/taro/karty/zhezly-tuz"]));
    expect(PUBLIC_PATHS.filter((path) => path.startsWith("/taro/karty/"))).toHaveLength(78);
  });

  test("the compatibility calculator is public", () => {
    expect(PUBLIC_PATHS).toContain("/sovmestimost");
  });

  test("the matrix calculator and the 22 arcana pages are public", () => {
    expect(PUBLIC_PATHS).toContain("/matrica-sudby");
    expect(PUBLIC_PATHS).toContain("/matrica-sudby/arkan-11-sila");
    expect(PUBLIC_PATHS.filter((path) => path.startsWith("/matrica-sudby/arkan-"))).toHaveLength(22);
  });
});

describe("structured data", () => {
  test("the site describes itself as a website and an organization, and the Lila page as a free web app", () => {
    const graph = (websiteJsonLd()["@graph"] as { "@type": string }[]).map((item) => item["@type"]);
    expect(graph).toEqual(["WebSite", "Organization"]);
    const organization = (websiteJsonLd()["@graph"] as { "@type": string; sameAs?: string[] }[]).find((item) => item["@type"] === "Organization");
    expect(organization?.sameAs).toEqual(["https://vk.ru/tvoy_orakul"]);
    expect(lilaGameJsonLd()).toMatchObject({ "@type": "WebApplication", offers: { price: "0", priceCurrency: "RUB" } });
  });

  test("the script text cannot close its own tag", () => {
    expect(jsonLdScript({ name: "</script><b>" })).not.toContain("<");
  });
});
