// Только вымышленные демонстрационные данные. Здесь нет чтения пользователей,
// платежей или вызовов модели. Используется тот же режим сборки, что в воркере.
import { calculateMatrix, LILA_CONCLUSION_CHAPTERS, replayLila } from "@oracle/core";
import { lilaCellByNumber } from "@oracle/content/lila";
import { buildChapterInputs, buildScenarioInput, fallbackChapter, buildConclusionInputs, fallbackConclusionChapter, fallbackNatalReport } from "@oracle/ai";
import { computeNatalChart } from "@oracle/core/natal";
import type { StoredChapter, StoredConclusionChapter, StoredNatalChapter } from "@oracle/db";

export const DEMO_DATE = "1990-01-15";
export const DEMO_MATRIX = calculateMatrix({ year: 1990, month: 1, day: 15 });
const prose = buildChapterInputs(DEMO_MATRIX).map(fallbackChapter);
export const DEMO_REPORT: readonly StoredChapter[] = [...prose, fallbackChapter(buildScenarioInput(DEMO_MATRIX, prose.map((chapter) => chapter.paragraphs?.[0] ?? "")))];

export const DEMO_INTENTION = "Как спокойнее планировать рабочую неделю?";
const rolls = [6, 5, 6, 4, 4, 4, 2, 1, 3, 2];
const notes: Readonly<Record<number, string>> = { 2: "Сравниваю свой темп с чужим.", 3: "Вижу, как сравнение отвлекает от моего плана.", 5: "Можно попросить коллегу уточнить срок.", 8: "Хочу оставить в плане место для отдыха." };
export const DEMO_MOVES = replayLila(rolls).results.map((move, index) => ({ ...move, n: index + 1, note: notes[index + 1] ?? null }));
const inputs = buildConclusionInputs({ intention: DEMO_INTENTION, moves: DEMO_MOVES, cellOf: lilaCellByNumber });
export const DEMO_CONCLUSION: readonly StoredConclusionChapter[] = LILA_CONCLUSION_CHAPTERS.map((id) => fallbackConclusionChapter({ ...inputs[id], earlier: [] }));

// Пример натального разбора: условный момент (Москва, 7 марта 1990, 12:00), главы собраны без ИИ из готовых текстов, как это делает воркер
export const DEMO_NATAL_DATE = "1990-03-07";
export const DEMO_NATAL_PLACE = "Москва";
const DEMO_NATAL_CHART = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
export const DEMO_NATAL_REPORT: readonly StoredNatalChapter[] = fallbackNatalReport(DEMO_NATAL_CHART);
