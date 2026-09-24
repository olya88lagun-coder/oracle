import { describe, expect, test } from "vitest";
import { PRIVATE_PATHS, PUBLIC_PATHS, publicMetadata } from "./seo";

describe("publicMetadata", () => {
  test("opens the page for indexing with a canonical address", () => {
    const metadata = publicMetadata({ title: "Контакты", description: "Как связаться", path: "/contacts" });

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({ canonical: "/contacts" });
    expect(metadata.title).toBe("Контакты");
    expect(metadata.openGraph).toMatchObject({ title: "Контакты", url: "/contacts", locale: "ru_RU", siteName: "ORACLE" });
  });

  test("an absolute title skips the site-wide template", () => {
    expect(publicMetadata({ title: "ORACLE", description: "d", path: "/", absoluteTitle: true }).title).toEqual({ absolute: "ORACLE" });
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
});
