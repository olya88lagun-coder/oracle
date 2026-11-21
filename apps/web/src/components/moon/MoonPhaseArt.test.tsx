import type { PhaseId } from "@oracle/core/moon/visual";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { MoonPhaseArt } from "./MoonPhaseArt";

test("a known phase renders its 160 px engraving as a lazy, decorative picture", () => {
  const markup = renderToStaticMarkup(<MoonPhaseArt phase="waxingGibbous" illumination={0.86} waxing />);
  expect(markup).toContain('src="/luna/phases/waxingGibbous-160.webp"');
  expect(markup).toContain('alt=""');
  expect(markup).toContain('loading="lazy"');
  expect(markup).toContain('aria-hidden="true"');
});

test("a phase without an engraving falls back to the mini disc", () => {
  const markup = renderToStaticMarkup(<MoonPhaseArt phase={"unknown" as PhaseId} illumination={0.5} waxing={false} />);
  expect(markup).toContain("moon-mini");
  expect(markup).not.toContain("<img");
});
