import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { CompatContext } from "./CompatContext";

describe("CompatContext", () => {
  const markup = renderToStaticMarkup(<CompatContext />);

  test("starts with the couple pressed and shows its questions", () => {
    expect(markup).toContain('<button type="button" class="natal-choice" aria-pressed="true">Пара</button>');
    expect(markup).toContain("Какие ожидания мы до сих пор не проговорили вслух?");
  });

  test("offers friends, colleagues and relatives, not pressed", () => {
    for (const label of ["Друзья", "Коллеги", "Родные"]) expect(markup).toContain(`aria-pressed="false">${label}</button>`);
  });

  test("is a labelled section with a group of buttons and says that the calculation is the same", () => {
    expect(markup).toContain('aria-labelledby="compat-context-title"');
    expect(markup).toContain('role="group"');
    expect(markup).toContain("Расчёт один и тот же для любого контекста");
  });
});
