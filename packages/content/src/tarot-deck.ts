export type TarotSuit = "major" | "wands" | "cups" | "swords" | "pentacles";
export type TarotCardRef = { readonly order: number; readonly slug: string; readonly name: string; readonly suit: TarotSuit; readonly rank: number };

export const TAROT_SUIT_LABELS: Readonly<Record<TarotSuit, string>> = { major: "Старшие арканы", wands: "Жезлы", cups: "Кубки", swords: "Мечи", pentacles: "Пентакли" };

// Слаги старших арканов совпадают со слагами арканов матрицы; номер (rank) — по колоде Райдер–Уэйт
const MAJOR: readonly (readonly [number, string, string])[] = [
  [0, "shut", "Шут"],
  [1, "mag", "Маг"],
  [2, "verkhovnaya-zhrica", "Верховная Жрица"],
  [3, "imperatrica", "Императрица"],
  [4, "imperator", "Император"],
  [5, "ierofant", "Иерофант"],
  [6, "vlyublennye", "Влюблённые"],
  [7, "kolesnica", "Колесница"],
  [8, "sila", "Сила"],
  [9, "otshelnik", "Отшельник"],
  [10, "koleso-fortuny", "Колесо Фортуны"],
  [11, "spravedlivost", "Справедливость"],
  [12, "poveshennyj", "Повешенный"],
  [13, "smert", "Смерть"],
  [14, "umerennost", "Умеренность"],
  [15, "dyavol", "Дьявол"],
  [16, "bashnya", "Башня"],
  [17, "zvezda", "Звезда"],
  [18, "luna", "Луна"],
  [19, "solnce", "Солнце"],
  [20, "sud", "Суд"],
  [21, "mir", "Мир"],
];

const RANKS: readonly (readonly [string, string])[] = [
  ["tuz", "Туз"],
  ["dvoyka", "Двойка"],
  ["troyka", "Тройка"],
  ["chetverka", "Четвёрка"],
  ["pyaterka", "Пятёрка"],
  ["shesterka", "Шестёрка"],
  ["semerka", "Семёрка"],
  ["vosmerka", "Восьмёрка"],
  ["devyatka", "Девятка"],
  ["desyatka", "Десятка"],
  ["pazh", "Паж"],
  ["ryttsar", "Рыцарь"],
  ["koroleva", "Королева"],
  ["korol", "Король"],
];

const SUITS: readonly (readonly [Exclude<TarotSuit, "major">, string, string])[] = [
  ["wands", "zhezly", "Жезлов"],
  ["cups", "kubki", "Кубков"],
  ["swords", "mechi", "Мечей"],
  ["pentacles", "pentakli", "Пентаклей"],
];

export const TAROT_DECK: readonly TarotCardRef[] = [
  ...MAJOR.map(([rank, slug, name], index) => ({ order: index + 1, slug, name, suit: "major" as const, rank })),
  ...SUITS.flatMap(([suit, prefix, genitive], suitIndex) =>
    RANKS.map(([rankSlug, rankName], rankIndex) => ({
      order: MAJOR.length + suitIndex * RANKS.length + rankIndex + 1,
      slug: `${prefix}-${rankSlug}`,
      name: `${rankName} ${genitive}`,
      suit,
      rank: rankIndex + 1,
    })),
  ),
];

export const tarotCardBySlug = (slug: string): TarotCardRef | undefined => TAROT_DECK.find((card) => card.slug === slug);
export const tarotFileName = (card: Pick<TarotCardRef, "order" | "slug">): string => `${String(card.order).padStart(2, "0")}-${card.slug}`;
export const matrixSlugOf = (card: TarotCardRef): string | null => (card.suit === "major" ? card.slug : null);
