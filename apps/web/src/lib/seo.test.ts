import { describe, expect, test } from "vitest";
import { PRIVATE_PATHS, PUBLIC_PATHS, publicMetadata } from "./seo";

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

  test("the matrix calculator and the 22 arcana pages are public", () => {
    expect(PUBLIC_PATHS).toContain("/matrica-sudby");
    expect(PUBLIC_PATHS).toContain("/matrica-sudby/arkan-11-sila");
    expect(PUBLIC_PATHS.filter((path) => path.startsWith("/matrica-sudby/arkan-"))).toHaveLength(22);
  });
});
