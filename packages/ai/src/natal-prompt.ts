import type { NatalChapterInput } from "./natal-input";
import { FORBIDDEN_RULE, NEUTRAL_GENDER_RULE, SCENARIO_FIELD_MAX_CHARS } from "./prompt";
import type { Prompt } from "./writer";

// Границы проверки ответа для глав натального разбора. Материала в них больше, чем в главах матрицы, поэтому и текст длиннее.
// Модель недобирает объём на 10–20 %, поэтому просим больше, чем требуем
export const NATAL_PROSE_LIMITS = { minParagraphs: 3, maxParagraphs: 6, minChars: 1000, maxChars: 3200 } as const;
const NATAL_ASKED_CHARS = { min: 1500, max: 2500 } as const;

const RULES = [
  "Ты — редактор сервиса самопознания «Твой оракул». Тебе дают тему главы разбора натальной карты, вступление и готовые тексты о положениях планет в знаках и домах и об аспектах между планетами.",
  "Задача: связать готовые тексты в цельную главу разбора для одного человека. Опирайся только на данные: не добавляй фактов, историй, чисел, значений планет, знаков, домов и аспектов, которых нет во входе. Не упоминай дату, время и место рождения.",
  "Пиши по-русски, на «вы», как гипотезы для размышления: «может», «часто», «стоит заметить». Это не предсказание и не консультация.",
  NEUTRAL_GENDER_RULE,
  FORBIDDEN_RULE,
];

const NAMING_RULE = "Называй планеты, знаки и дома так, как во входе.";

// Главы модель пишет обычным текстом: в JSON её собственные кавычки ломали разбор ответа
const PROSE_ANSWER = [
  `${NAMING_RULE} Ответ — только текст главы: без заголовков, списков, Markdown, JSON и пояснений.`,
  `Формат: ${NATAL_PROSE_LIMITS.minParagraphs}–${NATAL_PROSE_LIMITS.maxParagraphs} абзацев, между абзацами пустая строка, вместе ${NATAL_ASKED_CHARS.min}–${NATAL_ASKED_CHARS.max} знаков. Поле intro — вступление главы, material — готовые тексты: не копируй их дословно, свяжи в рассказ о том, как положения складываются в одного человека, и выдели то, что стоит заметить.`,
].join("\n\n");

const SCENARIO_ANSWER = [
  `${NAMING_RULE} Ответ — только JSON-объект по схеме ниже, без пояснений и без Markdown.`,
  `Схема ответа:
{"pattern": "…", "tension": "…", "resource": "…", "blindSpot": "…", "turningPoint": "…", "experiment": "…", "question": "…?"}
Это итог разбора по методике ORACLE. pattern — сценарий, который может повторяться; tension — где в нём напряжение; resource — на что опереться; blindSpot — что легко не замечать; turningPoint — что может изменить ход; experiment — небольшое действие на 7 дней; question — вопрос для себя, заканчивается знаком «?».
Каждое поле — 1–4 предложения, не больше ${SCENARIO_FIELD_MAX_CHARS} знаков. Поле scenarioDraft — черновик полей из готовых текстов: перепиши его в связные формулировки, сохраняя смысл. Поле previous — начала уже написанных глав: опирайся на них, но не повторяй дословно.`,
].join("\n\n");

export function buildNatalPrompt(input: NatalChapterInput): Prompt {
  const answer = input.chapter === "scenario" ? SCENARIO_ANSWER : PROSE_ANSWER;
  return { system: [...RULES, answer].join("\n\n"), user: JSON.stringify(input) };
}
