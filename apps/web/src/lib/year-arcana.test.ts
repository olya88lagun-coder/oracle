import { expect, test } from "vitest";
import { prepareMatrixHandoff, takeMatrixHandoff, yearShareContent, yearSocialLinks, YEAR_PATH } from "./year-arcana";

test("share links carry campaign tags but no birth data or result parameters", () => {
  const content = yearShareContent({ number: 5, name: "Иерофант" }, "https://oracle.test");
  expect(content.text).toContain("2027");
  const url = new URL(content.url);
  expect(url.pathname).toBe(YEAR_PATH);
  expect([...url.searchParams.keys()]).toEqual(["utm_source", "utm_medium", "utm_campaign"]);
  expect(url.searchParams.get("utm_campaign")).toBe("new_year_2027");
});

test("one-use tab handoff preserves date without changing profile or localStorage", () => {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) };
  expect(prepareMatrixHandoff(storage, "1992-03-14")).toBe(true);
  expect(takeMatrixHandoff(storage, new Date("2026-10-25"))).toBe("1992-03-14");
  expect(takeMatrixHandoff(storage, new Date("2026-10-25"))).toBeNull();
  prepareMatrixHandoff(storage, "invalid");
  expect(takeMatrixHandoff(storage, new Date("2026-10-25"))).toBeNull();
});

test("storage denial and missing storage leave the normal Matrix route usable", () => {
  const fail = () => { throw new Error("denied"); };
  const storage = { getItem: fail, setItem: fail, removeItem: fail };
  expect(prepareMatrixHandoff(storage, "1992-03-14")).toBe(false);
  expect(takeMatrixHandoff(storage, new Date())).toBeNull();
  expect(prepareMatrixHandoff(null, "1992-03-14")).toBe(false);
  expect(takeMatrixHandoff(null, new Date())).toBeNull();
});

test("VK opens a share form with only the public result text and campaign URL", () => {
  const links = yearSocialLinks({ number: 5, name: "Иерофант" }, "https://oracle.test");
  expect(links.map((link) => new URL(link.href).hostname)).toEqual(["vk.com"]);
  for (const link of links) {
    const target = new URL(link.href);
    const shared = new URL(target.searchParams.get("url")!);
    expect(shared.pathname).toBe(YEAR_PATH);
    expect(shared.searchParams.get("utm_campaign")).toBe("new_year_2027");
    expect(link.href).not.toMatch(/birth|date|1992/i);
  }
});
