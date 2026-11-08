import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { acceptedFatePaths } from "@/lib/numerology";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page from "./page";

// Как будет после приёмки партий 1 и 2 владелицей
vi.mock("../../../../../packages/content/src/numerology-manifest", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  NUMEROLOGY_ACCEPTED_BATCHES: new Set([1, 2]),
}));

test("with batch 1 accepted the catalog links all 12 fate numbers and they are public", () => {
  const html = renderToStaticMarkup(<Page />);
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) expect(html).toContain(`href="/numerologiya/chislo-sudby/${n}"`);
  expect(acceptedFatePaths()).toHaveLength(12);
  for (const path of acceptedFatePaths()) expect(PUBLIC_PATHS).toContain(path);
});
