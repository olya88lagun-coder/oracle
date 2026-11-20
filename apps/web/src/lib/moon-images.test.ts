import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PHASES } from "@oracle/core/moon/visual";
import { describe, expect, test } from "vitest";
import { PHASE_IMAGE_PHASES, phaseImage } from "./moon-images";

// Папка public находится рядом с src: ищем от файла теста, а не от текущей папки, чтобы CI из корня репозитория находил картинки
const onDisk = (url: string) => existsSync(fileURLToPath(new URL(`../../public${url}`, import.meta.url)));

describe("phase pictures", () => {
  test("every listed phase has all three sizes on disk", () => {
    for (const phase of PHASE_IMAGE_PHASES) for (const size of [960, 480, 160] as const) expect(onDisk(phaseImage(phase, size)!), `${phase} ${size}`).toBe(true);
  });

  test("the paths follow the pattern of the other pictures: the big one without a suffix", () => {
    expect(phaseImage("firstQuarter")).toBe("/luna/phases/firstQuarter.webp");
    expect(phaseImage("firstQuarter", 480)).toBe("/luna/phases/firstQuarter-480.webp");
    expect(phaseImage("firstQuarter", 160)).toBe("/luna/phases/firstQuarter-160.webp");
  });

  test("all eight phases have a picture", () => {
    expect(PHASES.filter((phase) => phaseImage(phase) === null)).toEqual([]);
    expect(PHASE_IMAGE_PHASES).toHaveLength(8);
  });

  test("a phase that is not in the list gets null instead of a path to a missing file", () => {
    expect(phaseImage("unknown" as never)).toBeNull();
  });
});
