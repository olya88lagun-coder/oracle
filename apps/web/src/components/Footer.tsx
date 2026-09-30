import Link from "next/link";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { DISCLAIMER } from "@/lib/legal";
import { SECTIONS } from "@/lib/sections";
import { SOCIAL_LINKS } from "@/lib/site";

const PRACTICES = SECTIONS.filter((section) => section.short !== "Блог");
const MORE = [
  { href: "/blog", label: "Блог" },
  { href: "/portret", label: "Мой портрет" },
  { href: "/contacts", label: "Контакты" },
] as const;
const LEGAL = [
  { href: "/privacy", label: "Политика обработки данных" },
  { href: "/oferta", label: "Оферта" },
  { href: "/consent", label: "Согласие" },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <Link href="/" className="wordmark wordmark--small" aria-label="Твой оракул — главная">
          Твой <em>оракул</em>
        </Link>
        <nav aria-label="Разделы сайта">
          {PRACTICES.map((section) => (
            <Link key={section.href} href={section.href}>
              {section.short}
            </Link>
          ))}
        </nav>
        <nav aria-label="О проекте">
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
        </nav>
      </div>
      <div className="footer__bottom">
        <p className="disclaimer">{DISCLAIMER}</p>
        <nav aria-label="Документы">
          {LEGAL.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <CookieSettingsButton />
        </nav>
      </div>
    </footer>
  );
}
