import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { expect, test } from "vitest";
import FatePage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const params = (n: string) => ({ params: Promise.resolve({ n }) });
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

test("only accepted numbers are built; everything else is a real 404", async () => {
  expect(dynamicParams).toBe(false);
  expect(generateStaticParams()).toHaveLength(NUMEROLOGY_ACCEPTED_BATCHES.has(1) ? 12 : 0);
  for (const n of ["10", "0", "abc", "07"]) {
    await expect(FatePage(params(n))).rejects.toThrow(NOT_FOUND);
    expect(await generateMetadata(params(n))).toEqual({});
  }
  if (!NUMEROLOGY_ACCEPTED_BATCHES.has(1)) await expect(FatePage(params("7"))).rejects.toThrow(NOT_FOUND);
});
