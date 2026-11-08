import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import HubPage from "@/app/numerologiya/page";
import { SquarePairLink } from "./SquarePairLink";

test("while batch 8 is not accepted there is no link to the compatibility page", () => {
  if (NUMEROLOGY_ACCEPTED_BATCHES.has(8)) return;
  expect(renderToStaticMarkup(<SquarePairLink />)).toBe("");
  expect(renderToStaticMarkup(<HubPage />)).not.toContain("/numerologiya/kvadrat-pifagora/sovmestimost");
});
