import { describe, expect, test } from "vitest";
import { parseArcanum } from "./arcana";
import { checkArcana, findStopPhrases } from "./check";
import { sampleArcanumSource } from "./testing";

const entry = (number: number, slug: string, file = `${String(number).padStart(2, "0")}-${slug}.md`, essence?: string) => ({
  file,
  arcanum: parseArcanum(sampleArcanumSource({ number, slug, essence }), file),
});

describe("findStopPhrases", () => {
  test("finds forbidden phrases regardless of case and ё/е", () => {
    expect(findStopPhrases("Вас Ждёт удача, а ещё — порча.")).toEqual(["вас ждет", "порча"]);
  });

  test("returns nothing for a calm text", () => {
    expect(findStopPhrases("Возможно, вам стоит присмотреться к этому.")).toEqual([]);
  });
});

describe("checkArcana", () => {
  test("accepts a complete, consistent set", () => {
    expect(checkArcana([entry(1, "mag"), entry(2, "zhrica")], 2)).toEqual([]);
  });

  test("reports a wrong count, a gap and a duplicate number", () => {
    const errors = checkArcana([entry(1, "mag"), entry(1, "mag-dva"), entry(3, "tri")], 3);
    expect(errors).toContain("номер 2 отсутствует");
    expect(errors).toContain("номер 1 встречается 2 раза");
  });

  test("reports a missing file count", () => {
    expect(checkArcana([entry(1, "mag")], 2)).toContain("файлов арканов 1, нужно 2");
  });

  test("reports a file name that does not match the header", () => {
    expect(checkArcana([entry(1, "mag", "01-maga.md")], 1)).toEqual(["01-maga.md: имя файла должно быть 01-mag.md"]);
  });

  test("reports stop phrases with the file name", () => {
    expect(checkArcana([entry(1, "mag", undefined, "Вам суждено стать магом.")], 1)).toEqual(["01-mag.md: запрещённые обороты — вам суждено"]);
  });
});
