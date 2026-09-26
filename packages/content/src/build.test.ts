import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArcana } from "../scripts/build-arcana.mjs";
import raw from "./generated/arcana.json";
import { loadArcana } from "./index";
import { sampleArcanumSource } from "./testing";

describe("collectArcana", () => {
  test("reads only markdown files, sorted, with normalized line endings", () => {
    const dir = mkdtempSync(join(tmpdir(), "arcana-"));
    writeFileSync(join(dir, "02-b.md"), "two\r\n");
    writeFileSync(join(dir, "01-a.md"), "one");
    writeFileSync(join(dir, "notes.txt"), "skip");

    expect(collectArcana(dir)).toEqual({ "01-a": "one", "02-b": "two" });
  });

  test("the committed arcana.json matches the markdown files — run pnpm content:build after editing texts", () => {
    const dir = fileURLToPath(new URL("../arcana", import.meta.url));
    expect(raw).toEqual(collectArcana(dir));
  });
});

describe("loadArcana", () => {
  test("parses every source and keeps the file name for error messages", () => {
    const entries = loadArcana({ "11-sila": sampleArcanumSource() });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.file).toBe("11-sila.md");
    expect(entries[0]?.arcanum.name).toBe("Сила");
  });
});
