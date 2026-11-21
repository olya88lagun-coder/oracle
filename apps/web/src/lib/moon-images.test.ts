import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PHASES } from "@oracle/core/moon/visual";
import { describe, expect, test } from "vitest";
import { LUNAR_DAY_IMAGES_READY, LUNAR_DAY_SLUGS, lunarDayImage, PHASE_IMAGE_PHASES, phaseImage, SIGN_IMAGE_SIGNS, signImage } from "./moon-images";

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

describe("sign pictures", () => {
  test("all twelve signs are listed, and each has all three sizes on disk", () => {
    expect(SIGN_IMAGE_SIGNS).toHaveLength(12);
    expect(new Set(SIGN_IMAGE_SIGNS).size).toBe(12);
    for (const sign of SIGN_IMAGE_SIGNS) for (const size of [960, 480, 160] as const) expect(onDisk(signImage(sign, size)!), `${sign} ${size}`).toBe(true);
  });

  test("the paths follow the same pattern as the phase pictures", () => {
    expect(signImage("scorpio")).toBe("/luna/signs/scorpio.webp");
    expect(signImage("scorpio", 480)).toBe("/luna/signs/scorpio-480.webp");
    expect(signImage("scorpio", 160)).toBe("/luna/signs/scorpio-160.webp");
  });

  test("an unknown sign gets null instead of a path to a missing file", () => {
    expect(signImage("ophiuchus" as never)).toBeNull();
  });
});

describe("lunar day pictures", () => {
  test("thirty unique slugs in the order of the days", () => {
    expect(LUNAR_DAY_SLUGS).toHaveLength(30);
    expect(new Set(LUNAR_DAY_SLUGS).size).toBe(30);
    expect(LUNAR_DAY_SLUGS[0]).toBe("svetilnik");
    expect(LUNAR_DAY_SLUGS[11]).toBe("chasha");
    expect(LUNAR_DAY_SLUGS[29]).toBe("lebed");
  });

  test("the engravings are switched on and every day has all three sizes on disk", () => {
    expect(LUNAR_DAY_IMAGES_READY).toBe(true);
    expect(lunarDayImage(12)).toBe("/luna/days/12-chasha.webp");
    for (let day = 1; day <= 30; day++) for (const size of [960, 480, 160] as const) expect(onDisk(lunarDayImage(day, size)!), `${day} ${size}`).toBe(true);
  });

  test("while the flag is off the helper returns null", () => {
    expect(lunarDayImage(12, 960, false)).toBeNull();
  });

  test("the paths use two-digit numbers and the same size suffixes as the other pictures", () => {
    expect(lunarDayImage(12, 480, true)).toBe("/luna/days/12-chasha-480.webp");
    expect(lunarDayImage(1, 960, true)).toBe("/luna/days/01-svetilnik.webp");
    expect(lunarDayImage(30, 160, true)).toBe("/luna/days/30-lebed-160.webp");
  });

  test("a day outside 1..30 gets null", () => {
    expect(lunarDayImage(0, 960, true)).toBeNull();
    expect(lunarDayImage(31, 960, true)).toBeNull();
    expect(lunarDayImage(1.5, 960, true)).toBeNull();
  });
});
