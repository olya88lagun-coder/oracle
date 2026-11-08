import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { expect, test } from "vitest";
import SquarePage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const params = (cell: string) => ({ params: Promise.resolve({ cell }) });
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

test("only accepted pages are built; anything else is a real 404", async () => {
  expect(dynamicParams).toBe(false);
  if (!NUMEROLOGY_ACCEPTED_BATCHES.has(6) && !NUMEROLOGY_ACCEPTED_BATCHES.has(7)) expect(generateStaticParams()).toEqual([]);
  for (const cell of ["0", "10", "01", "linia", "1111"]) {
    await expect(SquarePage(params(cell))).rejects.toThrow(NOT_FOUND);
    expect(await generateMetadata(params(cell))).toEqual({});
  }
});
