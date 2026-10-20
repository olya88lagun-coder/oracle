import Link from "next/link";
import { MORE_LINKS, MORE_LINKS_TITLE } from "@/lib/natal-more-links";

// Три ссылки под калькулятором: быстрые расчёты (асцендент, лунный знак) и словарь терминов. Рабочая вёрстка, вид доводит Codex
export function NatalMoreLinks() {
  return (
    <nav className="natal-more" aria-labelledby="natal-more-title">
      <h2 id="natal-more-title">{MORE_LINKS_TITLE}</h2>
      <ul>
        {MORE_LINKS.map((link) => (
          <li key={link.href}>
            <Link className="natal-more__link" href={link.href} prefetch={false}>
              <span className="natal-more__title">{link.title}</span>
              <span className="natal-more__text">{link.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
