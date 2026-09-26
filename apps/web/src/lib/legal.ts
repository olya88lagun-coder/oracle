// Оператор персональных данных — самозанятая, указана так же, как в «Мой налог»
export const OPERATOR = { name: "Лагутенкова Ольга Валентиновна", inn: "744923234850", email: "lagutenkova.olga@yandex.ru" } as const;

export const LEGAL_VERSIONS = { consent: "2026-09-v1", privacy: "2026-09-v2" } as const;
export const LEGAL_DATES = { consent: "24 сентября 2026 года", privacy: "26 сентября 2026 года" } as const;

export const DATA_STORAGE = "на сервере в Москве (Timeweb Cloud)";

export const DOCUMENT_PATHS = ["/contacts", "/privacy", "/consent"] as const;

export const DISCLAIMER =
  "«Твой оракул» — инструмент самопознания. Трактовки символических практик — не предсказания и не медицинская, психологическая, юридическая или финансовая консультация.";

export type DataRecipient = { name: string; what: string; why: string };

// Кому и что уходит. Политика и согласие читают один список, чтобы они не расходились.
// ЮKassa и сервис ИИ добавятся вместе с платными разборами (план 2) — с новой редакцией документов
export const DATA_RECIPIENTS: readonly DataRecipient[] = [
  {
    name: "Яндекс.Метрика",
    what: "IP-адрес, cookie, просмотренные страницы и сведения об устройстве",
    why: "статистика посещений — только если вы приняли cookie",
  },
];

// Метрика включается отдельным согласием в cookie-баннере, поэтому в согласии при входе её нет
export const LOGIN_CONSENT_RECIPIENTS = DATA_RECIPIENTS.filter((recipient) => recipient.name !== "Яндекс.Метрика");
