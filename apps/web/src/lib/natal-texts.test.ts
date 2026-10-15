import { describe, expect, test } from "vitest";
import { SIGN_ORDER } from "./natal-copy";
import { NATAL_KEY_TEXTS, keyTextFor, natalKeyId } from "./natal-texts";

describe("natal key texts", () => {
  test("the shipped registry is empty until the texts are published", () => {
    expect(Object.keys(NATAL_KEY_TEXTS)).toEqual([]);
    for (const sign of SIGN_ORDER) {
      expect(keyTextFor("sun", sign)).toBeNull();
      expect(keyTextFor("moon", sign)).toBeNull();
      expect(keyTextFor("ascendant", sign)).toBeNull();
    }
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
