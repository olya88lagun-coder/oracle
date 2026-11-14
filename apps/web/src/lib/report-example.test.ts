import { describe, expect, test } from "vitest";
import { TEASER_CHAPTERS } from "@/components/matrix/chapter-teaser";
import { DEMO_REPORT } from "@/server/product-demos";
import { REPORT_EXAMPLE_EXCERPTS, REPORT_EXAMPLE_PARAGRAPHS } from "./report-example";

describe("report example excerpts", () => {
  test("are the first paragraphs of the demo report chapters, word for word", () => {
    for (const id of TEASER_CHAPTERS) {
      const chapter = DEMO_REPORT.find((item) => item.id === id);
      expect(chapter?.paragraphs, id).toBeDefined();
      expect(REPORT_EXAMPLE_EXCERPTS[id], `${id}: обновите src/lib/report-example.ts из DEMO_REPORT`).toEqual(chapter!.paragraphs!.slice(0, REPORT_EXAMPLE_PARAGRAPHS));
    }
  });
});
