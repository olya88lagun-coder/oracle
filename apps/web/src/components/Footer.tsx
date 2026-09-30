import Link from "next/link";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { DISCLAIMER } from "@/lib/legal";
import { SOCIAL_LINKS } from "@/lib/site";

const LINKS = [
  { href: "/portret", label: "Мой портрет" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика обработки данных" },
  { href: "/oferta", label: "Оферта" },
  { href: "/consent", label: "Согласие" },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <nav aria-label="Документы и разделы">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        {SOCIAL_LINKS.map((link) => (
          <a key={link.url} href={link.url} rel="me noopener" target="_blank">
            {link.name}
          </a>
        ))}
        <CookieSettingsButton />
      </nav>
      <p className="disclaimer">{DISCLAIMER}</p>
    </footer>
  );
}
