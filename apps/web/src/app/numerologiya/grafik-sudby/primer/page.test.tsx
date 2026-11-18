import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { THREAD_PATH } from "@/lib/life-thread";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page, { metadata } from "./page";

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("../thread-fixtures")).mockThreadReportOpen(importOriginal as never));

const html = (): string => renderToStaticMarkup(<Page />);

test("the example has six chapters, the label and no date input", () => {
  const markup = html();
  expect(markup.match(/id="thread-chapter-[a-z]+"/g)).toHaveLength(6);
  expect(markup).toContain("Пример на вымышленной дате");
  expect(markup).not.toContain("<input");
});

test("one h1 and a link back to the thread calculator", () => {
  const markup = html();
  expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
  expect(markup).toContain(`href="${THREAD_PATH}"`);
});

test("the example is deterministic and listed in the site map", () => {
  expect(html()).toBe(html());
  expect(PUBLIC_PATHS).toContain(`${THREAD_PATH}/primer`);
});

test("metadata fits search snippets", () => {
  expect(String(metadata.title).length).toBeLessThanOrEqual(60);
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
  expect(String(metadata.description).length).toBeLessThanOrEqual(175);
});
