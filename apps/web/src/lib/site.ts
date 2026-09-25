export const SITE_NAME = "Твой оракул";

export function readSiteUrl(value: string | undefined): string {
  if (!value) throw new Error("NEXT_PUBLIC_SITE_URL is required");
  return new URL(value).origin;
}

// Next подставляет литерал process.env.NEXT_PUBLIC_SITE_URL при сборке — и в серверный, и в браузерный код
export const SITE_URL = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
