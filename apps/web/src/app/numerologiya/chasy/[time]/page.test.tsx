import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { expect, test } from "vitest";
import ClockPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const params = (time: string) => ({ params: Promise.resolve({ time }) });
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

test("only accepted times are built; other spellings are a real 404", async () => {
  expect(dynamicParams).toBe(false);
  const expected = [3, 4, 5].reduce((n, batch) => n + (NUMEROLOGY_ACCEPTED_BATCHES.has(batch) ? (batch === 5 ? 7 : 15) : 0), 0);
  expect(generateStaticParams()).toHaveLength(expected);
  for (const time of ["1111", "11:11", "24-24", "06-60", "11-12"]) {
    await expect(ClockPage(params(time))).rejects.toThrow(NOT_FOUND);
    expect(await generateMetadata(params(time))).toEqual({});
  }
});
