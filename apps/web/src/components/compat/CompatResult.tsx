import { arcanumByNumber } from "@oracle/content";
import { compatUnionByNumber } from "@oracle/content/compat";
import { KEY_POINTS, type Compatibility } from "@oracle/core";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";
import { compatSummary, POINT_LABELS } from "@/lib/compat";

type Props = { compat: Compatibility; headingRef?: Ref<HTMLHeadingElement>; actions: ReactNode };

const nameOf = (number: number) => arcanumByNumber(number).name;

function Person({ title, person }: { title: string; person: Compatibility["people"][number] }) {
  return (
    <section className="card stack compat-person" aria-label={title}>
      <h3>{title}</h3>
      {KEY_POINTS.map((point) => {
        const arcanum = arcanumByNumber(person[point]);
        return (
          <div key={point} className="stack compat-person__point">
            <p className="eyebrow">{POINT_LABELS[point]}</p>
            <p>
              <Link href={arcanumPath(arcanum)}>
                {arcanum.number} · {arcanum.name}
              </Link>
            </p>
            {arcanum.love.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function CompatResult({ compat, headingRef, actions }: Props) {
  const arcanum = arcanumByNumber(compat.pair);
  const union = compatUnionByNumber(compat.pair);
  return (
    <section className="stack compat-result" aria-labelledby="compat-pair-title">
      <h2 id="compat-pair-title" ref={headingRef} tabIndex={-1}>
        Аркан вашей пары
      </h2>
      <div className="card stack compat-pair">
        <Image className="compat-pair__art" src={arcanumImage(arcanum, "card")} alt="" width={480} height={480} unoptimized />
        <p className="eyebrow">Аркан {arcanum.number}</p>
        <p className="display compat-pair__name">{arcanum.name}</p>
        <p>{union.essence}</p>
        <p>
          <strong>Что даёт: </strong>
          {union.gives}
        </p>
        <p>
          <strong>Где стоит присмотреться: </strong>
          {union.attention}
        </p>
        <p className="lila-turn__question">
          <strong>Вопрос для двоих:</strong> {union.question}
        </p>
      </div>

      <h2>Вы и партнёр</h2>
      <div className="compat-people">
        <Person title="Вы" person={compat.people[0]} />
        <Person title="Партнёр" person={compat.people[1]} />
      </div>

      <section className="card stack" aria-labelledby="compat-summary-title">
        <h2 id="compat-summary-title">Где вы похожи и где различаетесь</h2>
        {compatSummary(compat, nameOf).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
      <div className="row compat-actions">{actions}</div>
    </section>
  );
}
