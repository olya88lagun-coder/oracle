import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { TAROT_DECK } from "@oracle/content/tarot";
import { describe, expect, test } from "vitest";
import { taroCardImage } from "./taro-paths";

describe("tarot illustrations", () => {
  test("every card has all three sizes in public/taro", () => {
    const missing: string[] = [];
    for (const card of TAROT_DECK) {
      for (const size of ["page", "card", "thumb"] as const) {
        const file = fileURLToPath(new URL(`../../public${taroCardImage(card, size)}`, import.meta.url));
        if (!existsSync(file)) missing.push(taroCardImage(card, size));
      }
    }
    expect(missing).toEqual([]);
  });
});
