import { NATAL_REPORT_REFUND_DAYS } from "@oracle/core";

// Срок возврата для всех платных услуг (решение владелицы 2026-10-20): оферта, контакты и блоки продажи читают его отсюда
export const REFUND_DAYS = NATAL_REPORT_REFUND_DAYS;

// Оператор персональных данных — самозанятая, указана так же, как в «Мой налог»
export const OPERATOR = { name: "Лагутенкова Ольга Валентиновна", inn: "744923234850", email: "lagutenkova.olga@yandex.ru" } as const;

export const LEGAL_VERSIONS = { consent: "2026-10-v2", privacy: "2026-10-v8", offer: "2026-10-v3" } as const;
export const LEGAL_DATES = { consent: "15 октября 2026 года", privacy: "20 октября 2026 года", offer: "20 октября 2026 года" } as const;

export const DATA_STORAGE = "на сервере в Москве (Timeweb Cloud)";

export const DOCUMENT_PATHS = ["/contacts", "/privacy", "/consent", "/oferta"] as const;

export const DISCLAIMER =
  "«Твой оракул» — инструмент самопознания. Трактовки символических практик — не предсказания и не медицинская, психологическая, юридическая или финансовая консультация.";

// basis: consent — передача по согласию; contract — для исполнения оферты (платный разбор), согласия при входе не требует
export type DataRecipient = { name: string; what: string; why: string; basis: "consent" | "contract" };

// Кому и что уходит. Политика и согласие читают один список, чтобы они не расходились.
export const DATA_RECIPIENTS: readonly DataRecipient[] = [
  {
    name: "Яндекс.Метрика",
    what: "IP-адрес, cookie, просмотренные страницы и сведения об устройстве",
    why: "статистика посещений — только если вы приняли cookie",
    basis: "consent",
  },
  {
    name: "ЮKassa (НКО «ЮМани» (ООО))",
    what: "сумма и назначение платежа, e-mail для чека; данные банковской карты вы вводите на стороне ЮKassa, сайт их не получает",
    why: "приём оплаты платных разборов и платной партии Лилы",
    basis: "contract",
  },
  {
    name: "GigaChat (ПАО Сбербанк)",
    what: "номера и названия арканов вашей матрицы и тексты их описаний; для разбора натальной карты — знаки, дома и аспекты планет вашей карты без даты, времени и места рождения; в платной партии Лилы — ваше намерение, записи мыслей, названия и описания клеток. Имя, дата рождения, e-mail и контакты не передаются",
    why: "подготовка текста платных разборов и абзацев проводника в платной партии Лилы",
    basis: "contract",
  },
];

// Метрика включается отдельным согласием в cookie-баннере, а оплата и подготовка разбора — по оферте,
// поэтому в согласии при входе нет ни тех, ни других: текст согласия не меняется вместе со списком получателей
export const LOGIN_CONSENT_RECIPIENTS = DATA_RECIPIENTS.filter((recipient) => recipient.basis === "consent" && recipient.name !== "Яндекс.Метрика");

const KOPECKS_IN_RUBLE = 100;

// «390 ₽» для оферты и контактов; цена хранится в копейках в @oracle/core
export function formatRubles(kopecks: number): string {
  return `${(kopecks / KOPECKS_IN_RUBLE).toLocaleString("ru-RU")} ₽`;
}
