import { calculateMatrix, type Matrix } from "@oracle/core";

// Пример из спецификации: 18.11.1988 → личность 18, центр 11, задача 10
export const EXAMPLE_MATRIX: Matrix = calculateMatrix({ year: 1988, month: 11, day: 18 });

const LONG = "Этот абзац нужен для проверки длины и повторяет простую мысль о том, что матрица — повод присмотреться к себе. ";

// Так модель отвечает по промпту: абзацы обычным текстом через пустую строку
export function proseAnswer(paragraphs = 4, repeat = 4): string {
  return Array.from({ length: paragraphs }, () => LONG.repeat(repeat).trim()).join("\n\n");
}

export const SCENARIO_ANSWER = JSON.stringify({
  pattern: "Может повторяться привычка терпеть до последнего.",
  tension: "Напряжение — между выдержкой и усталостью.",
  resource: "Опора — спокойная уверенность.",
  blindSpot: "Легко не замечать собственную злость.",
  turningPoint: "Говорить о чувствах раньше.",
  experiment: "Семь дней подряд записывать одно чувство за день.",
  question: "Где я держу себя сильнее, чем нужно?",
});
