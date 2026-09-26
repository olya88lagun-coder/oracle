import { ARCANA } from "@oracle/content";
import Link from "next/link";
import { arcanumPath } from "@/lib/arcana-paths";

export function ArcanaIndex({ current }: { current?: number }) {
  return (
    <nav className="stack" aria-labelledby="arcana-index">
      <h2 id="arcana-index">Все 22 аркана</h2>
      <ul className="arcana-index">
        {ARCANA.map((arcanum) => (
          <li key={arcanum.number}>
            <Link href={arcanumPath(arcanum)} aria-current={arcanum.number === current ? "page" : undefined}>
              <span className="arcana-index__number">{arcanum.number}</span> {arcanum.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
