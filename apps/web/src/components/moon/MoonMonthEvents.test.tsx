import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { TimelineItem } from "@/lib/lunar-calendar";
import { MoonMonthEvents } from "./MoonMonthEvents";

const items: TimelineItem[] = [
  { kind: "new", title: "Новолуние", label: "9 ноября, 10:02", date: "2026-11-09", at: 1, action: { label: "Расклад на новолуние", href: "/taro/rasklady/novolunie" } },
  { kind: "sign", title: "Луна входит в знак: Телец", label: "10 ноября, 04:30", date: "2026-11-10", at: 2 },
];

describe("MoonMonthEvents", () => {
  test("lists the events in an ordered list with times and no ratings of days", () => {
    const html = renderToStaticMarkup(<MoonMonthEvents items={items} />);
    expect(html).toContain("События месяца");
    expect(html.match(/<li /g)).toHaveLength(2);
    expect(html).toContain('<time dateTime="2026-11-09">9 ноября, 10:02</time>');
    expect(html).toContain("Луна входит в знак: Телец");
    expect(html).toContain('<a class="moon-events__action" href="/taro/rasklady/novolunie">Расклад на новолуние</a>');
    expect(html.match(/moon-events__action/g)).toHaveLength(1);
    expect(html).not.toMatch(/благоприятн|неблагоприятн|удачн/i);
  });

  test("renders nothing for an empty month", () => {
    expect(renderToStaticMarkup(<MoonMonthEvents items={[]} />)).toBe("");
  });
});
