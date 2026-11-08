import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { expect, test } from "vitest";
import { PYTHAGORAS_COMPAT_PATH } from "@/lib/pythagoras-compat";
import { PUBLIC_PATHS } from "@/lib/seo";
import PairPage, { generateMetadata } from "./page";

const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

test("while batch 8 is not accepted the page is a real 404 and not in the sitemap", async () => {
  if (NUMEROLOGY_ACCEPTED_BATCHES.has(8)) return;
  expect(() => PairPage()).toThrow(NOT_FOUND);
  expect(await generateMetadata()).toEqual({});
  expect(PUBLIC_PATHS).not.toContain(PYTHAGORAS_COMPAT_PATH);
});
