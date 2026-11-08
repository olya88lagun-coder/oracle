import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import Page from "./page";

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("./square-fixtures")).mockSquareAccepted(importOriginal as never));

test("with batches 6 and 7 accepted the catalog links all 9 cells and the lines page", () => {
  const html = renderToStaticMarkup(<Page />);
  for (const key of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "linii"]) expect(html).toContain(`href="/numerologiya/kvadrat-pifagora/${key}"`);
});
