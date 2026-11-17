import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { MoonDisc } from "./MoonDisc";

const render = (props: Partial<Parameters<typeof MoonDisc>[0]> = {}) => renderToStaticMarkup(<MoonDisc illumination={0.49} waxing phase="firstQuarter" {...props} />);

describe("MoonDisc", () => {
  test("hides itself from screen readers and draws the base, the rim and the lit part", () => {
    const html = render();
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("moon-disc__base");
    expect(html).toContain("moon-disc__rim");
    expect(html).toContain("moon-disc__lit");
  });

  test("draws no lit part at the new Moon and a lit part at the full Moon", () => {
    expect(render({ illumination: 0, phase: "new" })).not.toContain("moon-disc__lit");
    expect(render({ illumination: 1, phase: "full" })).toContain("moon-disc__lit");
  });

  test("has eight phase ticks with the current one marked, unless ticks are switched off", () => {
    const html = render();
    expect(html.match(/class="moon-disc__tick( is-current)?"/g)).toHaveLength(8);
    expect(html.match(/is-current/g)).toHaveLength(1);
    expect(html).toContain('data-phase="firstQuarter"');
    expect(render({ showTicks: false })).not.toContain("moon-disc__tick");
  });

  test("the mini size is a separate class and has no ticks", () => {
    const html = render({ size: "mini" });
    expect(html).toContain("moon-mini");
    expect(html).not.toContain("moon-disc__tick");
  });
});
