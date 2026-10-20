import { BODY_NAMES, SIGN_NAMES, type NatalPageRef } from "@oracle/content/natal";
import Link from "next/link";
import { NODE_AXIS_NORTH, NODE_AXIS_SOUTH, NODE_AXIS_TEXT, NODE_AXIS_TITLE, nodeAxisMirrorLabel } from "@/lib/natal-copy";
import { nodeAxisFor } from "@/lib/natal-pages";
import { natalPagePath } from "@/lib/natal-paths";
import { NatalGlyph } from "./NatalGlyph";

// Ось лунных узлов на странице «Северный узел в знаке»: северный знак, противоположный южный и, если страница открыта, переход к странице с другого конца оси
export function NatalNodeAxis({ page, idPrefix }: { page: NatalPageRef; idPrefix: string }) {
  const axis = nodeAxisFor(page);
  if (!axis) return null;
  const titleId = `${idPrefix}-axis`;
  const item = (label: string, sign: NatalPageRef["sign"]) => (
    <div className="natal-node-axis__item">
      <dt>{label}</dt>
      <dd>
        <NatalGlyph id={sign} />
        <span>{SIGN_NAMES[sign].nominative}</span>
      </dd>
    </div>
  );
  return (
    <section className="natal-node-axis" aria-labelledby={titleId}>
      <h2 id={titleId}>{NODE_AXIS_TITLE}</h2>
      <dl className="natal-node-axis__pair">
        {item(NODE_AXIS_NORTH, axis.north)}
        {item(NODE_AXIS_SOUTH, axis.south)}
      </dl>
      <p>{NODE_AXIS_TEXT}</p>
      {axis.mirror && (
        <p>
          <Link href={natalPagePath(axis.mirror)} prefetch={false}>
            {nodeAxisMirrorLabel(`${BODY_NAMES[axis.mirror.body].name} ${SIGN_NAMES[axis.mirror.sign].preposition} ${SIGN_NAMES[axis.mirror.sign].prepositional}`)}
          </Link>
        </p>
      )}
    </section>
  );
}
