import type { Matrix, MatrixPoint } from "./matrix";

export const MATRIX_REPORT_PRODUCT = "matrix_report";
export type Product = typeof MATRIX_REPORT_PRODUCT | "lila_session";
// Единственное место с ценой: блок продажи, оферта и платёж читают её отсюда
export const MATRIX_REPORT_PRICE_KOPECKS = 39_000;

// Главы платного разбора матрицы: порядок задаёт и оглавление, и порядок генерации
export const CHAPTER_IDS = ["core", "task", "love", "money", "family", "purpose", "scenario"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

export const CHAPTER_TITLES: Readonly<Record<ChapterId, string>> = {
  core: "Личность и центр",
  task: "Задача и точка роста",
  love: "Отношения",
  money: "Деньги и дело",
  family: "Род",
  purpose: "Предназначения",
  scenario: "Ваш сценарий",
};

// Итоговая глава «Ваш сценарий» — по методике ORACLE, поэтому у неё поля, а не абзацы; сама она строится вокруг центра
export const CHAPTER_POINTS: Readonly<Record<ChapterId, readonly MatrixPoint[]>> = {
  core: ["A", "E"],
  task: ["D"],
  love: ["love", "heart"],
  money: ["money", "heart"],
  family: ["F", "G", "H", "I"],
  purpose: ["personal", "social", "spiritual"],
  scenario: ["E"],
};

export const SCENARIO_FIELDS = ["pattern", "tension", "resource", "blindSpot", "turningPoint", "experiment", "question"] as const;
export type ScenarioField = (typeof SCENARIO_FIELDS)[number];

export const SCENARIO_TITLES: Readonly<Record<ScenarioField, string>> = {
  pattern: "Паттерн",
  tension: "Напряжение",
  resource: "Ресурс",
  blindSpot: "Слепая зона",
  turningPoint: "Точка изменения",
  experiment: "Эксперимент на 7 дней",
  question: "Вопрос для себя",
};

export type ReportChapter = { id: ChapterId; title: string; arcana: number[] };

export function reportChapters(matrix: Matrix): ReportChapter[] {
  return CHAPTER_IDS.map((id) => ({ id, title: CHAPTER_TITLES[id], arcana: CHAPTER_POINTS[id].map((point) => matrix[point]) }));
}

export const QUEUES = { generateReport: "generate-report" } as const;
export type GenerateReportJob = { purchaseId: string };
// Внутри задачи до трёх попыток модели на каждую из семи глав и сборка из блоков; повтор pg-boss — только на случай сбоя базы
export const GENERATE_JOB_OPTIONS = { retryLimit: 2, retryDelay: 30, retryBackoff: true, expireInSeconds: 1500 } as const;

export function generateReportJobKey(job: GenerateReportJob): string {
  return `generate-report:${job.purchaseId}`;
}
