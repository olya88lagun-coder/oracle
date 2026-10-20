import { ACCEPTED_BATCHES, NATAL_PAGES } from "@oracle/content/natal";
import { describe, expect, test } from "vitest";
import { SIGN_ORDER } from "./natal-copy";
import { NATAL_KEY_TEXTS, keyTextFor, natalKeyId } from "./natal-texts";

describe("natal key texts", () => {
  test("the shipped registry holds every accepted position, among them Sun, Moon and ascendant in all twelve signs", () => {
    expect(Object.keys(NATAL_KEY_TEXTS)).toHaveLength(NATAL_PAGES.filter((page) => ACCEPTED_BATCHES.has(page.batch)).length);
    for (const sign of SIGN_ORDER) {
      for (const body of ["sun", "moon", "ascendant"] as const) {
        const text = keyTextFor(body, sign);
        expect(text, `${body}-${sign}`).not.toBeNull();
        expect(text?.summary.length).toBeGreaterThanOrEqual(60);
        expect(text?.href).toMatch(/^\/natalnaya-karta\/[a-z-]+$/);
      }
    }
    expect(keyTextFor("sun", "pisces")?.href).toBe("/natalnaya-karta/solntse-v-rybah");
    expect(keyTextFor("ascendant", "leo")?.href).toBe("/natalnaya-karta/ascendent-vo-lve");
  });

  test("keys are written as <body>-<sign>", () => {
    expect(natalKeyId("sun", "pisces")).toBe("sun-pisces");
    expect(natalKeyId("ascendant", "cancer")).toBe("ascendant-cancer");
  });

  test("finds a published text in a registry passed in", () => {
    const registry = { "sun-pisces": { summary: "Начало", href: "/natalnaya-karta/solntse/ryby" } };
    expect(keyTextFor("sun", "pisces", registry)).toEqual(registry["sun-pisces"]);
    expect(keyTextFor("moon", "pisces", registry)).toBeNull();
    expect(keyTextFor("sun", "aries", registry)).toBeNull();
  });

  test("does not treat inherited object properties as published texts", () => {
    expect(keyTextFor("sun", "pisces", Object.create({ "sun-pisces": { summary: "x", href: "/x" } }))).toBeNull();
  });
});
