import { expect, test } from "vitest";
import { getRandomRoll } from "./lila-dice";

test("gives only 1-6 and every face appears", () => {
  const seen = new Set<number>();
  for (let i = 0; i < 600; i += 1) {
    const roll = getRandomRoll();
    expect(Number.isInteger(roll) && roll >= 1 && roll <= 6).toBe(true);
    seen.add(roll);
  }
  expect(seen.size).toBe(6);
});
