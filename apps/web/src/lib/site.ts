export const SITE_NAME = "Твой оракул";

// Официальные страницы проекта: ссылка в подвале и sameAs в разметке организации связывают их с сайтом (Telegram и Дзен добавятся, когда появятся)
export const SOCIAL_LINKS = [{ name: "ВКонтакте", url: "https://vk.ru/tvoy_orakul" }] as const;

export function readSiteUrl(value: string | undefined): string {
  if (!value) throw new Error("NEXT_PUBLIC_SITE_URL is required");
  return new URL(value).origin;
}

// Next подставляет литерал process.env.NEXT_PUBLIC_SITE_URL при сборке — и в серверный, и в браузерный код
export const SITE_URL = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
