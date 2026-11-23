// Вступления и шаблоны глав разбора «нити»: символическое прочтение, без прогнозов.

// Те же девять слов, что в apps/web/src/lib/life-thread-curve.ts: в пакете content веб-приложение недоступно
export const THREAD_YEAR_NAMES: Readonly<Record<number, string>> = { 1: "старт", 2: "терпение", 3: "самовыражение", 4: "фундамент", 5: "перемены", 6: "забота", 7: "осмысление", 8: "урожай", 9: "завершение" };

// Те же четыре слова, что PERIOD_POSITIONS в apps/web/src/lib/life-thread.ts
export const THREAD_PERIOD_POSITIONS: Readonly<Record<1 | 2 | 3 | 4, string>> = { 1: "формирование", 2: "зрелость", 3: "плоды", 4: "мудрость" };
export const THREAD_PERIOD_ROMAN: Readonly<Record<1 | 2 | 3 | 4, string>> = { 1: "I", 2: "II", 3: "III", 4: "IV" };

export const THREAD_MONTHS_GENITIVE: readonly string[] = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

// Срок до вершины словами: от одного года до девяти (больше цикл не бывает)
const YEARS_WORDS: readonly string[] = ["один год", "два года", "три года", "четыре года", "пять лет", "шесть лет", "семь лет", "восемь лет", "девять лет"];
export const threadYearsPhrase = (n: number): string => YEARS_WORDS[n - 1] ?? `${n} лет`;

export const THREAD_NOW_INTRO = (value: number, start: string, end: string): string =>
  `Сейчас идёт ваш личный год ${value} — «${THREAD_YEAR_NAMES[value] ?? ""}». Он начался ${start} и продлится до ${end}. Ниже сам год и двенадцать личных месяцев внутри него: это символическое прочтение, а не прогноз.`;

export const THREAD_PAST_INTRO = "Последние годы до нынешнего. Это не оценка прошлого, а вопросы, с которыми к нему можно вернуться: сверять воспоминания с числом не нужно.";
export const THREAD_PAST_INTRO_SHORT = "Вы родились совсем недавно, и пока прошлого мало: годов до нынешнего ещё не набралось. Эта глава оживёт, когда накопятся годы, о которых можно вспоминать.";

export const THREAD_RHYTHM_INTRO = "Личные годы идут девятилетним циклом. Год со значением 8 — «урожай», вершина цикла: это символическое название этапа, а не обещание успеха.";
export const THREAD_RHYTHM_PAST = (year: number): string => `Прошлая вершина цикла приходилась на ${year} год.`;
export const THREAD_RHYTHM_NEXT = (year: number, ahead: number): string => `Ближайшая вершина — ${year} год: до неё ${threadYearsPhrase(ahead)}.`;
export const THREAD_RHYTHM_NOW_PEAK = "Нынешний год — сам год вершины цикла.";
export const THREAD_RHYTHM_CYCLE = "Длина цикла — девять лет: за это время личные годы проходят от старта до завершения, и затем начинается новый круг.";
export const THREAD_RHYTHM_POSITION = (value: number): string => `Сейчас вы в году ${value} из девяти.`;

// Месяц с числом, которое уже было в этом году: тема та же, дословно её не повторяем
export const THREAD_MONTH_AGAIN = (value: number, firstHeading: string): string =>
  `Число месяца снова ${value}: тема та же, что в периоде ${firstHeading}. Посмотрите, чем этот месяц отличается от прошлого раза: что уже сделано, а что хочется сделать иначе.`;
