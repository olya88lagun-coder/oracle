import { redirect } from "next/navigation";
import { lunarMonthPath, moscowDate } from "@/lib/lunar-calendar-paths";

// Вход для ссылок и запроса «лунный календарь»: отправляет на страницу текущего месяца по Москве (временный редирект, копии текста нет).
// Страница зависит от момента запроса, поэтому не кэшируется
export const dynamic = "force-dynamic";

export default function LunarCalendarEntry() {
  const [year, month] = moscowDate(new Date()).split("-").map(Number) as [number, number];
  redirect(lunarMonthPath(year, month));
}
