import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PICKER_EXAMPLES } from "@/lib/taro-spread-picker";
import { SpreadPicker } from "./SpreadPicker";

describe("SpreadPicker", () => {
  const html = renderToStaticMarkup(<SpreadPicker />);

  test("asks «Что вас волнует?» with a labelled field and a submit button", () => {
    expect(html).toContain("Что вас волнует?");
    expect(html).toContain('for="spread-picker-question"');
    expect(html).toContain(">Подобрать расклад</button>");
  });

  test("offers every ready-made question as a button and promises the question stays in the browser", () => {
    for (const example of PICKER_EXAMPLES) expect(html).toContain(`>${example}</button>`);
    expect(html).toContain("Вопрос остаётся в вашем браузере и никуда не отправляется.");
  });

  test("shows no picks before the visitor asks", () => {
    expect(html).not.toContain("spread-picker__picks");
  });
});
