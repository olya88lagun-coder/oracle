// Только вымышленные демонстрационные данные. Здесь нет чтения пользователей,
// платежей или вызовов модели. Используется тот же режим сборки, что в воркере.
import { calculateMatrix, LILA_CONCLUSION_CHAPTERS, replayLila } from "@oracle/core";
import { lilaCellByNumber } from "@oracle/content/lila";
import { computeNatalChart } from "@oracle/core/natal";
import type { StoredChapter, StoredConclusionChapter, StoredNatalChapter } from "@oracle/db";
import { DEMO_LILA_AI_CHAPTERS } from "./lila-demo-ai";
import { DEMO_MATRIX_AI_CHAPTERS } from "./matrix-demo-ai";
import { DEMO_NATAL_AI_CHAPTERS } from "./natal-demo-ai";

export const DEMO_DATE = "1990-01-15";
export const DEMO_MATRIX = calculateMatrix({ year: 1990, month: 1, day: 15 });
// Настоящий разбор от ИИ по вымышленной дате (снимок в matrix-demo-ai.ts), а не сборка из готовых текстов
export const DEMO_REPORT: readonly StoredChapter[] = DEMO_MATRIX_AI_CHAPTERS;

export const DEMO_INTENTION = "Как спокойнее планировать рабочую неделю?";
const rolls = [6, 5, 6, 4, 4, 4, 2, 1, 3, 2];
const notes: Readonly<Record<number, string>> = { 2: "Сравниваю свой темп с чужим.", 3: "Вижу, как сравнение отвлекает от моего плана.", 5: "Можно попросить коллегу уточнить срок.", 8: "Хочу оставить в плане место для отдыха." };
export const DEMO_MOVES = replayLila(rolls).results.map((move, index) => ({ ...move, n: index + 1, note: notes[index + 1] ?? null }));
// Настоящий итог от ИИ по этой партии (снимок в lila-demo-ai.ts), а не сборка из готовых текстов
export const DEMO_CONCLUSION: readonly StoredConclusionChapter[] = DEMO_LILA_AI_CHAPTERS;

// Пример натального разбора: условный момент (Москва, 7 марта 1990, 12:25) и настоящий разбор, который по нему написал ИИ-редактор (снимок в natal-demo-ai.ts)
export const DEMO_NATAL_DATE = "1990-03-07";
export const DEMO_NATAL_PLACE = "Москва";
const DEMO_NATAL_CHART = computeNatalChart({ instant: new Date("1990-03-07T09:25:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
export const DEMO_NATAL_REPORT: readonly StoredNatalChapter[] = DEMO_NATAL_AI_CHAPTERS;
// Колесо и положения для обложки примера
export const DEMO_NATAL_CHART_DATA = { chart: DEMO_NATAL_CHART, birth: { city: DEMO_NATAL_PLACE, date: DEMO_NATAL_DATE, time: "12:25" } };
