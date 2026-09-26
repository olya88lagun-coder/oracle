import { ARCANA } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";

export function ArcanaIndex({ current }: { current?: number }) {
  return (
    <nav className="stack" aria-labelledby="arcana-index">
      <h2 id="arcana-index">Все 22 аркана</h2>
      <ul className="arcana-index">
        {ARCANA.map((arcanum) => (
          <li key={arcanum.number}>
            <Link href={arcanumPath(arcanum)} aria-current={arcanum.number === current ? "page" : undefined}>
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
