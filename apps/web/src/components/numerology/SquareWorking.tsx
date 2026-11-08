import type { PythagorasSquare } from "@oracle/core";

// Рабочие числа квадрата с открытой арифметикой: калькулятор квадрата и совместимость
export function SquareWorking({ iso, square }: { iso: string; square: PythagorasSquare }) {
  const [year = "", month = "", day = ""] = iso.split("-");
  const dateDigits = `${day}${month}${year}`;
  const [first, second, third, fourth] = square.working;
  const dayDigit = [...day].find((digit) => digit !== "0") ?? "";
  return <>
    <ol className="year-calculation muted numerology-square__working">
      <li>Первое число: {[...dateDigits].join(" + ")} = {first}</li>
      <li>Второе: сумма цифр {first} = {second}</li>
      <li>{`Третье: ${first} − 2 × ${dayDigit} = ${first - 2 * Number(dayDigit) < 0 ? `−${third}, без минуса ${third}` : third}`}</li>
      <li>Четвёртое: сумма цифр {third} = {fourth}</li>
    </ol>
    <p className="muted">В квадрат идут цифры {dateDigits} и {first}, {second}, {third}, {fourth}, нули не учитываются.</p>
  </>;
}
