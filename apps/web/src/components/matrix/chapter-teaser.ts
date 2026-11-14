import type { ChapterId, Matrix } from "@oracle/core";
import { arcanumByNumber, type Arcanum } from "@oracle/content";
import { teaserText } from "@/lib/report-offer";
import { relationshipLink, type LinkPoint } from "./matrix-link";

// Основа главы для блока продажи: арканы вашей матрицы и связка из их же описаний. Это не текст самого разбора:
// в разборе главу пишет ИИ-редактор на тех же точках и развивает её в целый текст
export type ChapterTeaser = { id: TeaserChapter; title: string; points: readonly LinkPoint[]; text: string };

export const TEASER_CHAPTERS = ["love", "money", "task", "core"] as const;
export type TeaserChapter = (typeof TEASER_CHAPTERS)[number] & ChapterId;

// Темы вопроса, из которых выбирает человек, и глава, к которой каждая ведёт
export const QUESTION_TOPICS: readonly { chapter: TeaserChapter; label: string }[] = [
  { chapter: "love", label: "Отношения" },
  { chapter: "money", label: "Деньги и дело" },
  { chapter: "task", label: "Выбор и задача" },
  { chapter: "core", label: "Я сам(а)" },
];

const MEANING_LIMIT = 160;
const point = (role: string, arcanum: Arcanum, section: "personality" | "center" | "task" | "money"): LinkPoint => ({ role, number: arcanum.number, name: arcanum.name, meaning: teaserText(arcanum[section][0] ?? "", MEANING_LIMIT) });

const lead = (arcanum: Arcanum) => `«${arcanum.keywords[0]}» (${arcanum.name})`;

export function chapterTeaser(matrix: Matrix, id: TeaserChapter): ChapterTeaser {
  if (id === "love") {
    const { points, link } = relationshipLink(matrix);
    return { id, title: "Отношения", points, text: link };
  }
  if (id === "money") {
    const money = arcanumByNumber(matrix.money);
    const heart = arcanumByNumber(matrix.heart);
    const same = money.number === heart.number;
    const second = (list: readonly string[]) => list[same ? 1 : 0] ?? "";
    const opening = same ? `Обе точки — ${money.name}: тема «${money.keywords[0]}» звучит в деле и деньгах вдвойне.` : `В деле и деньгах у вас встречаются ${lead(money)} и ${lead(heart)}.`;
    return {
      id,
      title: "Деньги и дело",
      points: [point("Точка денег", money, "money"), point("Сердце матрицы", heart, "money")],
      text: `${opening} На что можно опереться: «${money.resource[0]}» и «${second(heart.resource)}». Перекос, который легко не заметить: «${money.distortion[0]}» и «${second(heart.distortion)}».`,
    };
  }
  if (id === "task") {
    const task = arcanumByNumber(matrix.D);
    return {
      id,
      title: "Задача и точка роста",
      points: [point("Задача", task, "task")],
      text: `Ваша задача строится вокруг темы ${lead(task)}. Ресурс: «${task.resource[0]}» и «${task.resource[1]}». Перекос, который легко не заметить: «${task.distortion[0]}» и «${task.distortion[1]}».`,
    };
  }
  const personality = arcanumByNumber(matrix.A);
  const center = arcanumByNumber(matrix.E);
  const same = personality.number === center.number;
  return {
    id,
    title: "Личность и центр",
    points: [point("Личность", personality, "personality"), point("Центр", center, "center")],
    text: `${same ? `Личность и центр — один аркан, ${personality.name}: тема «${personality.keywords[0]}» проходит через всё.` : `Снаружи вы проявляетесь через ${lead(personality)}, а внутри опираетесь на ${lead(center)}.`} Ресурс: «${center.resource[0]}». Перекос, который легко не заметить: «${center.distortion[0]}».`,
  };
}
