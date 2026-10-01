import Image from "next/image";
import Link from "next/link";

export type PagerLink = { href: string; label: string; image: string; imageSize: number };

// Переход к соседним материалам: миниатюра, подпись «Предыдущая / Следующая» и название
export function DetailPager({ previous, next, label }: { previous: PagerLink; next: PagerLink; label: string }) {
  const item = (link: PagerLink, side: "prev" | "next") => (
    <Link className={`detail-pager__link detail-pager__link--${side}`} href={link.href}>
      <Image src={link.image} alt="" width={link.imageSize} height={link.imageSize} unoptimized />
      <span>
        <span className="detail-pager__label">{side === "prev" ? "Предыдущая" : "Следующая"}</span>
        <span className="detail-pager__title">{link.label}</span>
      </span>
    </Link>
  );
  return (
    <nav className="detail-pager" aria-label={label}>
      {item(previous, "prev")}
      {item(next, "next")}
    </nav>
  );
}
