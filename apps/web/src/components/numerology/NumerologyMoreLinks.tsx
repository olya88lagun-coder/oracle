import Link from "next/link";
import { NUMEROLOGY_PATH, PERSONAL_YEAR_PATH } from "@/lib/numerology";
import { PYTHAGORAS_PATH } from "@/lib/pythagoras";

const LINKS = [
  { href: NUMEROLOGY_PATH, name: "Число судьбы", text: "главное число даты рождения" },
  { href: PYTHAGORAS_PATH, name: "Квадрат Пифагора", text: "все цифры даты рождения в таблице 3×3" },
  { href: PERSONAL_YEAR_PATH, name: "Личный год 2027", text: "тема календарного года по дню и месяцу рождения" },
] as const;

// Связывает калькуляторы нумерологии со страниц значений: без этого блока на квадрат и личный год ссылались только их же страницы
export function NumerologyMoreLinks({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <nav aria-label="Ещё по дате рождения" className="numerology-related">
      <p className="eyebrow">Ещё по дате рождения</p>
      <ul>
        {LINKS.filter((link) => link.href !== current).map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.name}</Link> — {link.text}
          </li>
        ))}
      </ul>
    </nav>
  );
}
