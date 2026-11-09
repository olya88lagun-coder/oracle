import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import SquareCellPage from "@/app/numerologiya/kvadrat-pifagora/[cell]/page";
import HubPage from "@/app/numerologiya/page";
import SquarePage from "@/app/numerologiya/kvadrat-pifagora/page";
import { SquarePairLink } from "./SquarePairLink";

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("@/app/numerologiya/kvadrat-pifagora/square-fixtures")).mockPairAccepted(importOriginal as never));

const LINK = 'href="/numerologiya/kvadrat-pifagora/sovmestimost"';
const params = (cell: string) => ({ params: Promise.resolve({ cell }) });

test("with batch 8 accepted the link appears with its exact text", () => {
  const html = renderToStaticMarkup(<SquarePairLink />);
  expect(html).toContain(LINK);
  expect(html).toContain("Сравнить с квадратом партнёра");
});

test("the square calculator page, cell 1, the lines page and the hub link to the compatibility page", async () => {
  expect(renderToStaticMarkup(<SquarePage />)).toContain(LINK);
  expect(renderToStaticMarkup(await SquareCellPage(params("1")))).toContain(LINK);
  expect(renderToStaticMarkup(await SquareCellPage(params("linii")))).toContain(LINK);
  expect(renderToStaticMarkup(<HubPage />)).toContain(LINK);
});
