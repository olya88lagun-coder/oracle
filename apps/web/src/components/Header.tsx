import Link from "next/link";
import { HeaderNav } from "./HeaderNav";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="wordmark" aria-label="Твой оракул — главная">
          Твой <em>оракул</em>
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
