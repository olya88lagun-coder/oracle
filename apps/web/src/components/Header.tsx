import Image from "next/image";
import Link from "next/link";
import { HeaderNav } from "./HeaderNav";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo" aria-label="Твой оракул">
          <Image className="site-logo__mark" src="/oracle-mark.svg" width={40} height={40} alt="" unoptimized />
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
