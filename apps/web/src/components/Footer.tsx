import Link from "next/link";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { DISCLAIMER } from "@/lib/legal";

const LINKS = [
  { href: "/portret", label: "Мой портрет" },
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика обработки данных" },
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
        <CookieSettingsButton />
      </nav>
      <p className="disclaimer">{DISCLAIMER}</p>
    </footer>
  );
}
