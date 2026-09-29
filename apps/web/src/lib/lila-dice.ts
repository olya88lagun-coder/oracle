const DICE_SIDES = 6;
// Отсечение хвоста исключает перекос: 256 не делится на 6 без остатка
const LIMIT = 252;

export function getRandomRoll(): number {
  const buffer = new Uint8Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0]! >= LIMIT);
  return (buffer[0]! % DICE_SIDES) + 1;
}
