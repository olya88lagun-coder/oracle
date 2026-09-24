import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__logo">
        ORACLE
      </Link>
      <Link href="/portret">Мой портрет</Link>
    </header>
  );
}
