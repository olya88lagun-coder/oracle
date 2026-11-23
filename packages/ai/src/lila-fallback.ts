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
    path: () => {
      const route = input.visited.length
        ? ` Клетки по ходам: ${input.visited.map((move) => `${move.n}. «${move.cell}»${move.passage ? ` (${move.passage}${move.from ? `, с «${move.from}»` : ""})` : ""}`).join("; ")}.`
        : "";
      return [
        `Ваше намерение: «${intention}». Партия заняла ${facts.moves} ${plural(facts.moves, "ход", "хода", "ходов")}, вы открыли ${facts.openedCells} ${plural(facts.openedCells, "клетку", "клетки", "клеток")} из 72${facts.reachedGoal ? " и дошли до клетки 68" : facts.stoppedAt ? ` и остановились на клетке «${facts.stoppedAt}»` : ""}.${route}`,
        `На пути встретилось змей: ${facts.snakes}, стрел: ${facts.arrows}, пауз: ${facts.waits}. Змеи на поле — это возвращения к темам, которые просят внимания, а стрелы — переходы в другое состояние. Ни то ни другое не оценка: это способ посмотреть, как складывался ваш путь.`,
      ];
    },
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
      const lastNote = input.notes.at(-1);
      if (!top && lastNote) {
        return [
          `Гипотеза: в записях партии звучит тема клетки «${lastNote.cell}» — «${lastNote.text}». Это может быть частью ответа на вопрос «${intention}». Это предположение, а не вывод: его можно проверить.`,
          `Шаг на 7 дней: каждый вечер в 21:00, за столом, запишите одну строку о том, как сегодня проявилось «${lastNote.text}». Проверка: через неделю перечитайте записи подряд и отметьте, что повторяется и что изменилось.`,
        ];
      }
      if (!top) {
        return [
          "Гипотеза: раз ни одна тема не повторилась, ответ на ваш вопрос может складываться из нескольких разных сторон, а не из одной.",
          "Шаг на 7 дней: каждый вечер в 21:00, за столом, запишите одну строку о том, что изменилось в вашем намерении. Через неделю перечитайте записи подряд и отметьте, что изменилось в формулировках.",
        ];
      }
      // Связка: факт маршрута → что записано на этой клетке → осторожная гипотеза → проверяемый шаг
      const note = input.notes.filter((item) => item.cell === top.cell).at(-1);
      const seen = `К клетке «${top.cell}» вы возвращались ${top.visits} ${plural(top.visits, "раз", "раза", "раз")}${note ? `, и на ходе ${note.n} записали: «${note.text}»` : ""}.`;
      return [
        `${seen} Гипотеза: тема этой клетки может быть важной частью вашего вопроса «${input.intention}». Это предположение, а не вывод: его можно проверить.`,
        `Шаг на 7 дней: каждый вечер в 21:00, за столом, запишите одну строку ответа на вопрос клетки «${top.cell}»: ${top.question} Проверка: через неделю перечитайте записи подряд и отметьте, что повторяется и что изменилось. Если повторов нет, гипотеза не подтвердилась, и это тоже результат.`,
      ];
    },
  };
  return { id: input.chapter, source: "fallback", paragraphs: paragraphs[input.chapter]() };
}

export const conclusionChapterTitle = (id: LilaConclusionChapterId): string => LILA_CONCLUSION_TITLES[id];
