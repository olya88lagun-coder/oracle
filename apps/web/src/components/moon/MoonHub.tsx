import Link from "next/link";
import { MOON_EXTRA_TEXTS_ACCEPTED, NATAL_MOON_NOTE } from "@oracle/content/moon-year";
import { currentMonth, currentMonthPath } from "@/lib/lunar-calendar-paths";
import { MOON_PATH } from "@/lib/moon-paths";
import { PHASES_PATH, yearMoonPath } from "@/lib/moon-year-paths";
import { NATAL_PATH } from "@/lib/natal-paths";
import { TARO_DAY_PATH } from "@/lib/taro-paths";

// «Продолжить»: ссылки по лунному разделу с подписью в одну строку; страница, на которой стоит блок (`current`), в нём не повторяется
export function MoonHub({ now, current, id }: { now: Date; current?: string; id: string }) {
  const { year } = currentMonth(now);
  const items = [
    { href: currentMonthPath(now), title: "Лунный календарь на месяц", note: "сетка месяца день за днём" },
    { href: MOON_PATH, title: "Луна сегодня", note: "фаза, лунные сутки и знак на сейчас" },
    { href: PHASES_PATH, title: "Фазы Луны", note: "восемь фаз и ближайшие переходы" },
    { href: yearMoonPath("new", year), title: `Новолуния ${year}`, note: "точное время и знак Луны" },
    { href: yearMoonPath("full", year), title: `Полнолуния ${year}`, note: "время, знак Луны и расстояние до Земли" },
    { href: TARO_DAY_PATH, title: "Вытянуть карту дня", note: "одна карта Таро на сегодня" },
    { href: NATAL_PATH, title: "Какая Луна в вашей натальной карте", note: "бесплатный расчёт по дате, времени и месту рождения" },
  ].filter((item) => item.href !== current);
  return (
    <section className="moon-links moon-links--hub" aria-labelledby={id}>
      <h2 id={id}>Продолжить</h2>
      {MOON_EXTRA_TEXTS_ACCEPTED && <p className="moon-links__lead">{NATAL_MOON_NOTE}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.title}</Link>
            <span className="moon-links__note">{item.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
