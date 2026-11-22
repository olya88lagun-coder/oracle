import Link from "next/link";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { DISCLAIMER } from "@/lib/legal";
import { LUNAR_CALENDAR_PATH } from "@/lib/lunar-calendar-paths";
import { MOON_PATH } from "@/lib/moon-paths";
import { SECTIONS } from "@/lib/sections";
import { SOCIAL_LINKS } from "@/lib/site";
import { WEEKDAY_PATH } from "@/lib/weekday-paths";

// «Луна» есть в шапке, а в подвале у неё свои строки «Луна сегодня» и «Лунный календарь»
const PRACTICES = SECTIONS.filter((section) => section.short !== "Блог" && section.short !== "Луна");
const MORE = [
  { href: "/blog", label: "Блог" },
  { href: "/portret", label: "Мой портрет" },
  { href: "/contacts", label: "Контакты" },
  { href: "/metodika", label: "О текстах и методике" },
] as const;
const LEGAL = [
  { href: "/privacy", label: "Политика обработки данных" },
  { href: "/oferta", label: "Оферта" },
  { href: "/consent", label: "Согласие" },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__brand">
          <Link href="/" className="wordmark wordmark--small" aria-label="Твой оракул — главная">
            Твой <em>оракул</em>
          </Link>
          <p className="disclaimer">{DISCLAIMER}</p>
        </div>
        <nav aria-label="Разделы сайта" className="footer__col footer__col--practices">
          <p className="footer__title">Практики</p>
          <div className="footer__links">
            {PRACTICES.map((section) => (
              <Link key={section.href} href={section.href}>
                {section.short}
              </Link>
            ))}
            {/* Не в SECTIONS: этот список общий с шапкой, а там уже семь разделов */}
            <Link href={MOON_PATH}>Луна сегодня</Link>
            <Link href={LUNAR_CALENDAR_PATH}>Лунный календарь</Link>
            <Link href={WEEKDAY_PATH}>Дни недели и планеты</Link>
          </div>
        </nav>
        <nav aria-label="О проекте" className="footer__col">
          <p className="footer__title">Сайт</p>
          <div className="footer__links">
            {MORE.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            {SOCIAL_LINKS.map((link) => (
              <a key={link.url} href={link.url} rel="me noopener" target="_blank">
                {link.name}
              </a>
            ))}
          </div>
        </nav>
      </div>
      <nav aria-label="Документы" className="footer__legal">
        {LEGAL.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <CookieSettingsButton />
      </nav>
    </footer>
  );
}
