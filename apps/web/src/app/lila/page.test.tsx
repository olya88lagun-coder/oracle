import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

// Платная часть страницы зависит от флагов продажи; здесь они выключены
vi.mock("@/server/payments-deps", () => ({ salesEnabled: () => false }));

const { default: LilaPage } = await import("./page");

describe("/lila", () => {
  const html = renderToStaticMarkup(<LilaPage />);

  test("the first screen offers the trial roll next to «Играть» and keeps the explanation as a link", () => {
    const hero = /<div class="lila-hero">[\s\S]*?<\/div>/.exec(html)?.[0] ?? "";
    expect(hero).toContain('href="/lila/igra"');
    expect(hero).toMatch(/href="#try"[^>]*>\s*Попробовать бросок/);
    expect(hero).toMatch(/href="#how">Как это устроено/);
  });

  test("the targets of those links exist", () => {
    expect(html).toContain('id="try"');
    expect(html).toContain('id="how"');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
});
