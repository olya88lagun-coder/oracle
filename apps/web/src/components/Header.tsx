import Link from "next/link";
import { HeaderNav } from "./HeaderNav";

// Знак из apps/web/src/app/icon.svg: полумесяц и точка на тёмной плитке — компактная замена текстового имени в шапке
function LogoMark() {
  return (
    <svg className="site-logo__mark" viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="var(--bg)" />
      <rect className="site-logo__frame" x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <defs>
        <mask id="site-logo-cut">
          <rect width="64" height="64" fill="#fff" />
          <circle cx="38.5" cy="25.5" r="17" fill="#000" />
        </mask>
      </defs>
      <circle cx="30" cy="32" r="19" fill="var(--accent)" mask="url(#site-logo-cut)" />
      <circle cx="40" cy="26.5" r="3" fill="var(--accent)" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo" aria-label="Твой оракул">
          <LogoMark />
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
