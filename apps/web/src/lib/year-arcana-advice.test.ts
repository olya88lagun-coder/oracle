import { ARCANA } from "@oracle/content";
import { expect, test } from "vitest";
import { yearAdvice } from "./year-arcana-advice";

test("every arcanum has three actionable prompts, keeping its existing action", () => {
  const weeks = new Set<string>();
  for (const arcanum of ARCANA) {
    const tips = yearAdvice(arcanum);
    expect(tips).toHaveLength(3);
    expect(tips[0]?.text).toBe(arcanum.action);
    expect(new Set(tips.map((tip) => tip.text)).size).toBe(3);
    expect(tips.every((tip) => tip.text.length > 35)).toBe(true);
    expect(tips.map((tip) => tip.text).join(" ")).not.toMatch(/гарантирован|обязательно случится|точная дата|предскажет/i);
    weeks.add(tips[1]!.text);
  }
  expect(weeks.size).toBe(22);
});
