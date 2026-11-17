import { spreadFromParam, TARO_SPREADS, type Spread } from "./taro-spreads";

// Подбор расклада по словам вопроса. Работает только в браузере: вопрос никуда не отправляется и не сохраняется.
// Слово-признак совпадает с началом слова вопроса; знак «$» в конце требует точного слова.
const TOPICS: Readonly<Record<string, readonly string[]>> = {
  otnosheniya: ["отношен", "любов", "любит", "пара", "парн", "муж", "жена", "девушк", "парень", "близост", "свидан", "расстав", "бывш", "брак", "чувств", "вернет", "вернут"],
  roditeli: ["родител", "мам", "пап", "отец", "отцом", "мать", "матер", "бабушк", "дедушк"],
  konflikt: ["конфликт", "ссор", "ссорил", "спор", "обид", "руга", "поссор", "напряж", "претенз", "недопонима"],
  vybor: ["выбор", "выбра", "решит", "решени", "вариант", "или$", "сомнева", "перекрест", "двух"],
  "delo-i-dengi": ["работ", "дело", "деньг", "карьер", "бизнес", "доход", "зарплат", "финанс", "проект", "коллег", "начальник", "заработ"],
  "smena-raboty": ["менят", "смен", "увол", "уйти", "уходит", "работ", "перейти", "профессии"],
  "na-segodnya": ["сегодн", "утро", "утром", "вечер", "завтра", "денек"],
  "novyy-god": ["новый год", "новог", "итог", "январ", "декабр", "год$", "года"],
  samopoznanie: ["себя", "себе", "самооценк", "самопозна", "характер", "призван", "потерял", "смысл", "кто я", "внутрен", "чего хочу"],
  novolunie: ["новолуни", "начат", "начало", "намерени", "с нуля"],
  polnolunie: ["полнолуни", "завершит", "отпустит", "законч", "подвест"],
  "tri-karty": ["ситуац", "общий", "любой", "быстр", "просто"],
};

// Вопросы-предсказания: расклады на них не отвечают, и мы говорим об этом прямо
const PREDICTION = /(^|\s)да или нет|верн[её]тся ли|любит ли|будет ли|получится ли|сбудется|изменит ли|напишет ли|позвонит ли|вернут ли/;

export type SpreadPick = { spreads: Spread[]; predictive: boolean; matched: boolean };

const normalize = (text: string): string => text.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9\s]/g, " ").replace(/\s+/g, " ").trim();

function score(words: readonly string[], text: string, keys: readonly string[]): number {
  let total = 0;
  for (const key of keys) {
    const exact = key.endsWith("$");
    const stem = exact ? key.slice(0, -1) : key;
    if (stem.includes(" ")) {
      if (text.includes(stem)) total += 2;
    } else if (words.some((word) => (exact ? word === stem : word.startsWith(stem)))) {
      total += 1;
    }
  }
  return total;
}

export function pickSpreads(question: string, limit = 3): SpreadPick {
  const text = normalize(question);
  // «да или нет» — не признак выбора, а вопрос-предсказание: слово «или» из него не считаем
  const words = text.replace(/да или нет/g, " ").split(" ").filter(Boolean);
  const predictive = PREDICTION.test(text);
  const ranked = TARO_SPREADS.map((spread, order) => ({ spread, order, points: score(words, text, TOPICS[spread.slug] ?? []) }))
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points || a.order - b.order)
    .slice(0, limit)
    .map((item) => item.spread);
  if (ranked.length > 0) return { spreads: ranked, predictive, matched: true };
  // Ничего не узнали: универсальный расклад, а для «предсказательного» вопроса ещё и расклад на выбор
  const fallback = [spreadFromParam("tri-karty")!];
  if (predictive) fallback.push(spreadFromParam("vybor")!);
  return { spreads: fallback, predictive, matched: false };
}

// Готовые вопросы под полем: нажатие подставляет текст и сразу подбирает расклад
export const PICKER_EXAMPLES: readonly string[] = ["Менять ли мне работу?", "Что происходит в отношениях?", "Как мне поговорить с мамой?", "Мне нужно выбрать из двух вариантов", "Что важно заметить сегодня?"];
