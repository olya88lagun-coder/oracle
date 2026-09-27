export type LilaCellNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72;

export type LilaCell = {
  number: LilaCellNumber;
  name: string;
};

export type LilaConnection = {
  from: LilaCellNumber;
  to: LilaCellNumber;
};

export type LilaLine = LilaConnection & {
  kind: "arrow" | "snake";
};

export const CELLS: LilaCell[] = [
  { number: 1, name: "Рождение" },
  { number: 2, name: "Майя" },
  { number: 3, name: "Гнев" },
  { number: 4, name: "Жадность" },
  { number: 5, name: "Физический план" },
  { number: 6, name: "Заблуждение" },
  { number: 7, name: "Тщеславие" },
  { number: 8, name: "Алчность" },
  { number: 9, name: "Чувственный план" },
  { number: 10, name: "Очищение" },
  { number: 11, name: "Развлечения" },
  { number: 12, name: "Зависть" },
  { number: 13, name: "Ничтожность" },
  { number: 14, name: "Астральный план" },
  { number: 15, name: "План фантазии" },
  { number: 16, name: "Ревность" },
  { number: 17, name: "Сострадание" },
  { number: 18, name: "План радости" },
  { number: 19, name: "План кармы" },
  { number: 20, name: "Благотворительность" },
  { number: 21, name: "Искупление" },
  { number: 22, name: "План Дхармы" },
  { number: 23, name: "Небесный план" },
  { number: 24, name: "Плохая компания" },
  { number: 25, name: "Хорошая компания" },
  { number: 26, name: "Печаль" },
  { number: 27, name: "Самоотверженное служение" },
  { number: 28, name: "Истинная религиозность" },
  { number: 29, name: "Отсутствие религиозности" },
  { number: 30, name: "Хорошие тенденции" },
  { number: 31, name: "План святости" },
  { number: 32, name: "План равновесия" },
  { number: 33, name: "План ароматов" },
  { number: 34, name: "План вкуса" },
  { number: 35, name: "Чистилище" },
  { number: 36, name: "Ясность сознания" },
  { number: 37, name: "Джняна" },
  { number: 38, name: "Прана-лока" },
  { number: 39, name: "Апана-лока" },
  { number: 40, name: "Въяна-лока" },
  { number: 41, name: "Человеческий план" },
  { number: 42, name: "План Агни" },
  { number: 43, name: "Рождение человека" },
  { number: 44, name: "Неведение" },
  { number: 45, name: "Правильное знание" },
  { number: 46, name: "Различение" },
  { number: 47, name: "План нейтральности" },
  { number: 48, name: "Солнечный план" },
  { number: 49, name: "Лунный план" },
  { number: 50, name: "План аскетизма" },
  { number: 51, name: "Земля" },
  { number: 52, name: "План насилия" },
  { number: 53, name: "План жидкостей" },
  { number: 54, name: "План духовной преданности" },
  { number: 55, name: "Эгоизм" },
  { number: 56, name: "План изначальных вибраций" },
  { number: 57, name: "План газов" },
  { number: 58, name: "План сияния" },
  { number: 59, name: "План реальности" },
  { number: 60, name: "Позитивный интеллект" },
  { number: 61, name: "Негативный интеллект" },
  { number: 62, name: "Счастье" },
  { number: 63, name: "Тамас" },
  { number: 64, name: "Феноменальный план" },
  { number: 65, name: "План внутреннего пространства" },
  { number: 66, name: "План блаженства" },
  { number: 67, name: "План космического блага" },
  { number: 68, name: "Космическое Сознание" },
  { number: 69, name: "План Абсолюта" },
  { number: 70, name: "Саттвагуна" },
  { number: 71, name: "Раджогуна" },
  { number: 72, name: "Тамогуна" },
];

export const SNAKES: LilaConnection[] = [
  { from: 12, to: 8 },
  { from: 16, to: 4 },
  { from: 24, to: 7 },
  { from: 29, to: 6 },
  { from: 44, to: 9 },
  { from: 52, to: 35 },
  { from: 55, to: 3 },
  { from: 61, to: 13 },
  { from: 63, to: 2 },
  { from: 72, to: 51 },
];

export const ARROWS: LilaConnection[] = [
  { from: 10, to: 23 },
  { from: 17, to: 69 },
  { from: 20, to: 32 },
  { from: 22, to: 60 },
  { from: 27, to: 41 },
  { from: 28, to: 50 },
  { from: 37, to: 66 },
  { from: 45, to: 67 },
  { from: 46, to: 62 },
  { from: 54, to: 68 },
];

export const BOARD_COLUMNS = 9;
export const BOARD_ROWS = 8;
export const GOAL_CELL: LilaCellNumber = 68;

export function cellPosition(number: LilaCellNumber) {
  const zeroBased = number - 1;
  const rowFromBottom = Math.floor(zeroBased / BOARD_COLUMNS);
  const indexInRow = zeroBased % BOARD_COLUMNS;
  const col = rowFromBottom % 2 === 0 ? indexInRow : BOARD_COLUMNS - 1 - indexInRow;

  return {
    col,
    row: BOARD_ROWS - 1 - rowFromBottom,
  };
}

export function getCell(number: LilaCellNumber) {
  return CELLS[number - 1]!;
}

export function lineForCell(number: LilaCellNumber): LilaLine | null {
  const snake = SNAKES.find((line) => line.from === number);
  if (snake) return { ...snake, kind: "snake" };

  const arrow = ARROWS.find((line) => line.from === number);
  if (arrow) return { ...arrow, kind: "arrow" };

  return null;
}

export function isLilaCellNumber(value: number): value is LilaCellNumber {
  return Number.isInteger(value) && value >= 1 && value <= 72;
}

