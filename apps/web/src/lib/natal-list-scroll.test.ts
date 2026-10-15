import { describe, expect, test } from "vitest";
import { keepOptionVisible } from "./natal-list-scroll";

const list = (top: number, bottom: number, scrollTop = 100) => ({ scrollTop, getBoundingClientRect: () => ({ top, bottom }) });
const option = (top: number, bottom: number) => ({ getBoundingClientRect: () => ({ top, bottom }) });

describe("keepOptionVisible", () => {
  test("does not move the list when the option is fully visible", () => {
    const box = list(100, 300);
    keepOptionVisible(box, option(150, 194));
    expect(box.scrollTop).toBe(100);
  });

  test("scrolls up by the hidden part when the option is above the list", () => {
    const box = list(100, 300);
    keepOptionVisible(box, option(80, 124));
    expect(box.scrollTop).toBe(80);
  });

  test("scrolls down by the hidden part when the option is below the list", () => {
    const box = list(100, 300);
    keepOptionVisible(box, option(270, 314));
    expect(box.scrollTop).toBe(114);
  });

  test("an option flush with the list edges stays put", () => {
    const box = list(100, 300);
    keepOptionVisible(box, option(100, 144));
    keepOptionVisible(box, option(256, 300));
    expect(box.scrollTop).toBe(100);
  });
});
