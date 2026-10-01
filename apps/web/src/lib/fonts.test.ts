import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "../app");

// Сборка не должна зависеть от внешней сети: шрифты лежат в репозитории и подключены через next/font/local
describe("self-hosted fonts", () => {
  const layout = readFileSync(resolve(appDir, "layout.tsx"), "utf8");

  test("the layout uses local font files, not next/font/google", () => {
    expect(layout).not.toContain("next/font/google");
    expect(layout).toContain("next/font/local");
  });

  test("every font file the layout points to exists, with its licence next to it", () => {
    const files = [...layout.matchAll(/src: "\.\/fonts\/([^"]+)"/g)].map((match) => match[1]!);
    expect(files).toHaveLength(2);
    for (const file of files) expect(existsSync(resolve(appDir, "fonts", file)), file).toBe(true);
    expect(existsSync(resolve(appDir, "fonts/OFL-Manrope.txt"))).toBe(true);
    expect(existsSync(resolve(appDir, "fonts/OFL-NotoSerifDisplay.txt"))).toBe(true);
  });

  test("no stylesheet or component pulls fonts from an outside host", () => {
    const css = readFileSync(resolve(appDir, "globals.css"), "utf8");
    expect(css).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
});
