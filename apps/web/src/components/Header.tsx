import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__logo">
        Твой оракул
      </Link>
      <Link href="/portret" className="site-header__account">
        <span className="site-header__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5.5 19.5c1.2-3.3 3.6-5 6.5-5s5.3 1.7 6.5 5" strokeLinecap="round" />
          </svg>
        </span>
        Мой портрет
      </Link>
    </header>
  );
}
