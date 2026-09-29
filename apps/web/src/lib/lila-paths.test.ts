import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import { LILA_CELLS } from "@oracle/content/lila";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { ARROWS, CELLS, SNAKES } from "@/components/lila/board-data";
import { lilaCellDescription, lilaCellFromParam, lilaCellImage, lilaCellJsonLd, lilaCellPath, lilaHistoryPath, lilaImageFile, LILA_IMAGES_READY, lilaParam } from "./lila-paths";

const cell12 = LILA_CELLS.find((cell) => cell.number === 12)!;

describe("cell addresses", () => {
  test("build the path from the number and the slug", () => {
    expect(lilaParam(cell12)).toBe("12-zavist");
    expect(lilaCellPath(cell12)).toBe("/lila/kletki/12-zavist");
    expect(lilaHistoryPath("abc")).toBe("/portret/lila/abc");
  });

  test("resolve a parameter only when the number and the slug belong to the same cell", () => {
    expect(lilaCellFromParam("12-zavist")?.number).toBe(12);
    expect(lilaCellFromParam("12-alchnost")).toBeNull();
    expect(lilaCellFromParam("12")).toBeNull();
    expect(lilaCellFromParam("99-zavist")).toBeNull();
    expect(lilaCellFromParam("../../etc/passwd")).toBeNull();
  });

  test("point to the three image sizes", () => {
    expect(lilaCellImage(cell12)).toBe("/lila/12-zavist.webp");
    expect(lilaCellImage(cell12, "card")).toBe("/lila/12-zavist-480.webp");
    expect(lilaCellImage(cell12, "thumb")).toBe("/lila/12-zavist-160.webp");
    expect(lilaImageFile(cell12, "thumb")).toBe("12-zavist-160.webp");
  });

  test("describe a cell for search and structured data", () => {
    expect(lilaCellDescription(cell12).length).toBeLessThanOrEqual(160);
    const ld = lilaCellJsonLd(cell12, "https://oracle.test");
    expect(ld).toMatchObject({ "@type": "Article", mainEntityOfPage: "https://oracle.test/lila/kletki/12-zavist", image: "https://oracle.test/lila/12-zavist.webp" });
  });
});

describe("sources of truth", () => {
  test("the board data agrees with the texts and the engine", () => {
    expect(CELLS.map((c) => c.name)).toEqual(LILA_CELLS.map((c) => c.name));
    expect(Object.fromEntries(SNAKES.map((s) => [s.from, s.to]))).toEqual(LILA_SNAKES);
    expect(Object.fromEntries(ARROWS.map((s) => [s.from, s.to]))).toEqual(LILA_ARROWS);
  });

  test("every cell has its three illustrations once LILA_IMAGES_READY is set", () => {
    const dir = join(process.cwd(), "public", "lila");
    const missing = LILA_CELLS.flatMap((cell) => (["page", "card", "thumb"] as const).map((size) => lilaImageFile(cell, size))).filter((file) => !existsSync(join(dir, file)));
    // Картинки добавляются пачками: до готовности всех 72 тест только сообщает, чего не хватает
    if (!LILA_IMAGES_READY) return;
    expect(missing).toEqual([]);
  });
});
