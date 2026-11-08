import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { expect, test } from "vitest";
import YearNumberPage, { dynamicParams, generateStaticParams } from "./page";

const params = (n: string) => ({ params: Promise.resolve({ n }) });
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

test("masters do not exist for the personal year; unaccepted numbers are 404", async () => {
  expect(dynamicParams).toBe(false);
  expect(generateStaticParams()).toHaveLength(NUMEROLOGY_ACCEPTED_BATCHES.has(2) ? 9 : 0);
  for (const n of ["11", "22", "0", "10"]) await expect(YearNumberPage(params(n))).rejects.toThrow(NOT_FOUND);
  if (!NUMEROLOGY_ACCEPTED_BATCHES.has(2)) await expect(YearNumberPage(params("1"))).rejects.toThrow(NOT_FOUND);
});
