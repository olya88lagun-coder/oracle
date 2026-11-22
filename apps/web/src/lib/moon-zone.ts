// Местное время по часовому поясу места (IANA): для календаря месяца в браузере. Без расчётов Луны, импортируется в клиентские компоненты
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const clockFormats = new Map<string, Intl.DateTimeFormat>();

// «2026-11-23»: местная дата момента `now`
export function zoneDate(now: Date, zone: string): string {
  let format = dateFormats.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" });
    dateFormats.set(zone, format);
  }
  return format.format(now);
}

// Минуты от местной полуночи для момента `ms`
export function zoneMinutes(ms: number, zone: string): number {
  let format = clockFormats.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "numeric", hourCycle: "h23" });
    clockFormats.set(zone, format);
  }
  const parts = format.formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return get("hour") * 60 + get("minute");
}
