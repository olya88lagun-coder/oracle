import { describe, expect, test } from "vitest";
import type { CompatUnion } from "./compat";
import { checkCompatUnions } from "./compat-check";

const names = new Map(Array.from({ length: 22 }, (_, i) => [i + 1, `Аркан ${i + 1}`] as const));
const text = (n: number) => "Слово ".repeat(n).trim();
const union = (number: number, patch: Partial<CompatUnion> = {}): CompatUnion => ({
  number,
  name: `Аркан ${number}`,
  essence: text(30),
  gives: text(20),
  attention: text(20),
  question: `${text(6)}?`,
  ...patch,
});
const full = () => Array.from({ length: 22 }, (_, i) => union(i + 1));

describe("checkCompatUnions", () => {
  test("accepts a full valid set", () => {
    expect(checkCompatUnions(full(), names)).toEqual([]);
  });

  test("reports a missing arcanum, a wrong name, short and long fields, a question without «?» and stop phrases", () => {
    expect(checkCompatUnions(full().slice(1), names).join("\n")).toMatch(/союзов 21, нужно 22/);
    expect(checkCompatUnions([union(1, { name: "Другое" }), ...full().slice(1)], names).join("\n")).toMatch(/имя аркана/);
    expect(checkCompatUnions([union(1, { essence: "Коротко." }), ...full().slice(1)], names).join("\n")).toMatch(/Суть союза/);
    expect(checkCompatUnions([union(1, { gives: text(200) }), ...full().slice(1)], names).join("\n")).toMatch(/Что даёт/);
    expect(checkCompatUnions([union(1, { question: text(6) }), ...full().slice(1)], names).join("\n")).toMatch(/«\?»/);
    expect(checkCompatUnions([union(1, { attention: `${text(20)} Вас ждёт успех.` }), ...full().slice(1)], names).join("\n")).toMatch(/запрещённые обороты/);
  });
});
