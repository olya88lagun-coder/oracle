import { describe, expect, test } from "vitest";
import { COMPAT_PATH, COMPAT_SHARE_TEXT, COMPAT_SHARE_URL, compatSummary, POINT_LABELS } from "./compat";

const nameOf = (n: number) => `Аркан ${n}`;
const person = (personality: number, center: number, task: number) => ({ personality, center, task });

describe("share link", () => {
  test("is the calculator with source marks and carries no dates", () => {
    expect(COMPAT_SHARE_URL).toMatch(new RegExp(`${COMPAT_PATH}\\?utm_source=share&utm_medium=partner$`));
    expect(COMPAT_SHARE_URL).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(COMPAT_SHARE_TEXT).toBe("Давай проверим нашу совместимость по дате рождения");
  });
});

describe("compatSummary", () => {
  test("names each shared key point", () => {
    const text = compatSummary({ pair: 5, people: [person(1, 2, 3), person(1, 2, 9)], sameAtPoint: ["personality", "center"], sharedArcana: [1, 2] }, nameOf).join(" ");
    expect(text).toContain(POINT_LABELS.personality.toLowerCase());
    expect(text).toContain("Аркан 2");
  });

  test("mentions shared arcana that sit at different points", () => {
    const text = compatSummary({ pair: 5, people: [person(1, 2, 3), person(3, 8, 9)], sameAtPoint: [], sharedArcana: [3] }, nameOf).join(" ");
    expect(text).toContain("Аркан 3");
    expect(text).toContain("разных точках");
  });

  test("says plainly when nothing matches, without judging", () => {
    const lines = compatSummary({ pair: 5, people: [person(1, 2, 3), person(4, 5, 6)], sameAtPoint: [], sharedArcana: [] }, nameOf);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/не пересекаются/);
    expect(lines[0]).toMatch(/не хорошо и не плохо/);
  });
});
