import { ARCANA } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { ARCANA_HUB_PATH, arcanumImage, arcanumPath } from "@/lib/arcana-paths";

type Props = {
  current?: number;
  // По умолчанию — арканы матрицы; совместимость передаёт свои адреса и подписи
  title?: string;
  hub?: { href: string; label: string } | null;
  pathOf?: (arcanum: { number: number; slug: string }) => string;
};

export function ArcanaIndex({ current, title = "Все 22 аркана", hub = { href: ARCANA_HUB_PATH, label: "Значения всех арканов в матрице судьбы" }, pathOf = arcanumPath }: Props) {
  return (
    <nav className="stack" aria-labelledby="arcana-index">
      <h2 id="arcana-index">{title}</h2>
      {hub && (
        <p>
          <Link className="matrix-link" href={hub.href}>
            {hub.label}
          </Link>
        </p>
      )}
      <ul className="arcana-index">
        {ARCANA.map((arcanum) => (
          <li key={arcanum.number}>
            <Link href={pathOf(arcanum)} aria-current={arcanum.number === current ? "page" : undefined}>
              <Image className="arcana-index__art" src={arcanumImage(arcanum, "thumb")} alt="" width={160} height={160} unoptimized />
              <span className="arcana-index__number">{String(arcanum.number).padStart(2, "0")}</span>
              <span className="arcana-index__name">{arcanum.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
