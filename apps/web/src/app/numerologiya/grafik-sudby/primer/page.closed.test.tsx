import { expect, test, vi } from "vitest";
import { THREAD_PATH } from "@/lib/life-thread";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page from "./page";

// Партия 10 не принята: пример закрыт
vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("../thread-fixtures")).mockThreadReportBatch(importOriginal as never, () => false));

test("until batch 10 is accepted the example is a real 404 and is not in the site map", () => {
  expect(() => Page()).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  expect(PUBLIC_PATHS).not.toContain(`${THREAD_PATH}/primer`);
});
