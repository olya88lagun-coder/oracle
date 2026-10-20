import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { natalPageBySlug } from "@oracle/content/natal";
import { describe, expect, test } from "vitest";
import { NATAL_COVER_SIZE, NATAL_COVER_SLUGS, natalCoverPath } from "./natal-covers";

const dir = fileURLToPath(new URL("../../public/natal/", import.meta.url));

// Размер WebP (VP8, с потерями) лежит в заголовке: байты 26–29 — ширина и высота по 14 бит
function webpSize(file: Buffer): { width: number; height: number } {
  expect(file.toString("ascii", 0, 4)).toBe("RIFF");
  expect(file.toString("ascii", 8, 12)).toBe("WEBP");
  return { width: file.readUInt16LE(26) & 0x3fff, height: file.readUInt16LE(28) & 0x3fff };
}

describe("natal covers", () => {
  test("every cover belongs to a page of the manifest and has its file of 640×640", () => {
    for (const slug of NATAL_COVER_SLUGS) {
      expect(natalPageBySlug(slug), slug).toBeDefined();
      expect(webpSize(readFileSync(`${dir}${slug}.webp`)), slug).toEqual({ width: NATAL_COVER_SIZE, height: NATAL_COVER_SIZE });
    }
  });

  test("there are no files in public/natal that no page uses", () => {
    expect(readdirSync(dir).filter((name) => name.endsWith(".webp")).map((name) => name.replace(/\.webp$/, "")).sort()).toEqual([...NATAL_COVER_SLUGS].sort());
  });

  test("the path is given only for a page that has a cover", () => {
    expect(natalCoverPath("solntse-v-rybah")).toBe("/natal/solntse-v-rybah.webp");
    expect(natalCoverPath("solntse-v-ovne")).toBeNull();
    expect(natalCoverPath("")).toBeNull();
  });
});
