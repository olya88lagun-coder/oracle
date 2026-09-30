import { LILA_CONCLUSION_TITLES, type LilaConclusionChapterId } from "@oracle/core";
import type { ConclusionInput } from "./lila-input";

export type GeneratedConclusionChapter = { id: LilaConclusionChapterId; source: "ai" | "fallback"; paragraphs: string[] };
const NOTES_IN_FALLBACK = 5;
const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? few : many;
};

// Итог без ИИ собирается из фактов партии и готовых текстов клеток — модель не нужна
export function fallbackConclusionChapter(input: ConclusionInput): GeneratedConclusionChapter {
  const { facts, intention } = input;
  const paragraphs: Record<LilaConclusionChapterId, () => string[]> = {
    path: () => [
      `Ваше намерение: «${intention}». Партия заняла ${facts.moves} ${plural(facts.moves, "ход", "хода", "ходов")}, вы открыли ${facts.openedCells} ${plural(facts.openedCells, "клетку", "клетки", "клеток")} из 72${facts.reachedGoal ? " и дошли до клетки 68" : facts.stoppedAt ? ` и остановились на клетке «${facts.stoppedAt}»` : ""}.`,
      `На пути встретилось змей: ${facts.snakes}, стрел: ${facts.arrows}, пауз: ${facts.waits}. Змеи на поле — это возвращения к темам, которые просят внимания, а стрелы — переходы в другое состояние. Ни то ни другое не оценка: это способ посмотреть, как складывался ваш путь.`,
    ],
    repeats: () =>
      input.repeated.length === 0
        ? ["Возвратов на одну и ту же клетку в этой партии не было: темы сменяли друг друга без повторов.", "Это может говорить о том, что вопросы клеток быстро сменялись; стоит вернуться к тем, что задели больше всего, и задать себе их вопрос ещё раз."]
        : [
            `К этим клеткам вы возвращались: ${input.repeated.map((item) => `«${item.cell}» — ${item.visits} ${plural(item.visits, "раз", "раза", "раз")}`).join("; ")}.`,
            "Повторные визиты часто показывают тему, которая остаётся значимой для намерения. Это гипотеза, а не вывод: стоит присмотреться, что в этих клетках откликается каждый раз.",
          ],
    noticed: () =>
      input.notes.length === 0
        ? ["В этой партии записей мыслей нет.", "Записи помогают замечать повторяющиеся слова и темы. В следующей партии можно оставлять по одной строке на ходу — итог станет точнее."]
        : [
            `Вот что вы записывали: ${input.notes.slice(-NOTES_IN_FALLBACK).map((note) => `ход ${note.n}, «${note.cell}»: «${note.text}»`).join("; ")}.`,
            "Перечитайте записи подряд: какие слова повторяются и как они связаны с вашим намерением? Это может подсказать, что для вас в этом вопросе главное.",
          ],
    outcome: () => {
      const top = input.repeated[0];
      return [
        top
          ? `Гипотеза: тема клетки «${top.cell}» может быть важной частью вашего вопроса — вы возвращались к ней несколько раз.`
          : "Гипотеза: раз ни одна тема не повторилась, ответ на ваш вопрос может складываться из нескольких разных сторон, а не из одной.",
        top ? `Шаг на 7 дней: раз в день возвращайтесь к вопросу клетки «${top.cell}» — ${top.question} — и коротко записывайте ответ.` : "Шаг на 7 дней: раз в день возвращайтесь к своему намерению и записывайте одну строку о том, что изменилось.",
      ];
    },
  };
  return { id: input.chapter, source: "fallback", paragraphs: paragraphs[input.chapter]() };
}

export const conclusionChapterTitle = (id: LilaConclusionChapterId): string => LILA_CONCLUSION_TITLES[id];
