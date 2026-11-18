import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import NumerologyPage from "@/app/numerologiya/page";
import { THREAD_PATH } from "@/lib/life-thread";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page from "./page";

// Страница читает вошедшего и флаги продажи: в тестах гость без продажи
vi.mock("@/server/viewer", () => ({ currentUser: async () => null }));
vi.mock("@/server/owner", () => ({ isOwnerUser: async () => false }));
vi.mock("@/server/payments-deps", () => ({ salesEnabled: () => false }));

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("./thread-fixtures")).mockThreadClosed(importOriginal as never));

const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

test("until batch 9 is accepted the page is a real 404", async () => {
  await expect(Page()).rejects.toThrow(NOT_FOUND);
});

test("until batch 9 is accepted the page is not in the site map and the hub does not link to it", () => {
  expect(PUBLIC_PATHS).not.toContain(THREAD_PATH);
  expect(renderToStaticMarkup(<NumerologyPage />)).not.toContain(`href="${THREAD_PATH}"`);
});
