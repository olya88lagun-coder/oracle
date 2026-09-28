import { CHAPTER_TITLES, type ChapterId, type Matrix, type MatrixPoint } from "@oracle/core";
import { arcanumByNumber, POSITIONS, SECTION_TITLES, type Arcanum } from "@oracle/content";

type BlockKey = "essence" | "personality" | "center" | "task" | "love" | "money" | "resource" | "distortion" | "action" | "question";

export type ChapterArcanum = { role: string; number: number; name: string; blocks: Record<string, readonly string[]> };
// Всё, что уходит модели: описание позиции, номера и названия арканов, готовые блоки. Имени, даты и идентификаторов здесь нет
export type ChapterInput = { chapter: ChapterId; title: string; position: string; arcana: ChapterArcanum[]; previous?: string[] };

type Slot = { point: MatrixPoint; role: string; blocks: readonly BlockKey[] };

const ESSENCE: readonly BlockKey[] = ["essence"];

const SLOTS: Readonly<Record<ChapterId, readonly Slot[]>> = {
  core: [
    { point: "A", role: "личность", blocks: ["essence", "personality"] },
    { point: "E", role: "центр", blocks: ["essence", "center"] },
  ],
  task: [{ point: "D", role: "задача", blocks: ["task", "resource", "distortion"] }],
  love: [
    { point: "love", role: "точка любви", blocks: ["love"] },
    { point: "heart", role: "сердце матрицы", blocks: ["love"] },
  ],
  money: [
    { point: "money", role: "точка денег", blocks: ["money"] },
    { point: "heart", role: "сердце матрицы", blocks: ["money"] },
  ],
  family: [
    { point: "F", role: "род, линия отца", blocks: ESSENCE },
    { point: "H", role: "род, линия отца", blocks: ESSENCE },
    { point: "G", role: "род, линия матери", blocks: ESSENCE },
    { point: "I", role: "род, линия матери", blocks: ESSENCE },
  ],
  purpose: [
    { point: "personal", role: "личное предназначение", blocks: ESSENCE },
    { point: "social", role: "социальное предназначение", blocks: ESSENCE },
    { point: "spiritual", role: "духовное предназначение", blocks: ESSENCE },
  ],
  scenario: [{ point: "E", role: "центр", blocks: ["resource", "distortion", "action", "question"] }],
};

const blockText = (arcanum: Arcanum, key: BlockKey): readonly string[] => {
  const value = arcanum[key];
  return typeof value === "string" ? [value] : value;
};

function chapterArcanum(matrix: Matrix, slot: Slot): ChapterArcanum {
  const arcanum = arcanumByNumber(matrix[slot.point]);
  return {
    role: slot.role,
    number: arcanum.number,
    name: arcanum.name,
    blocks: Object.fromEntries(slot.blocks.map((key) => [SECTION_TITLES[key], blockText(arcanum, key)])),
  };
}

function chapterInput(matrix: Matrix, chapter: ChapterId): ChapterInput {
  return { chapter, title: CHAPTER_TITLES[chapter], position: POSITIONS[chapter], arcana: SLOTS[chapter].map((slot) => chapterArcanum(matrix, slot)) };
}

// Главы 1–6 не зависят друг от друга и пишутся параллельно
export function buildChapterInputs(matrix: Matrix): ChapterInput[] {
  return (["core", "task", "love", "money", "family", "purpose"] as const).map((chapter) => chapterInput(matrix, chapter));
}

// Итоговая глава опирается на то, что уже написано в главах 1–6: модель получает их первые абзацы
export function buildScenarioInput(matrix: Matrix, previous: readonly string[]): ChapterInput {
  return { ...chapterInput(matrix, "scenario"), previous: [...previous] };
}
