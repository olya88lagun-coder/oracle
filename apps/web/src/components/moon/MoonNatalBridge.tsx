"use client";

import Image from "next/image";
import Link from "next/link";
import { useId } from "react";
import { reachGoal } from "@/lib/analytics";
import { BRIDGE_NOTE, bridgeCopy, type BridgeFrom } from "@/lib/moon-natal-bridge";

// Блок-мост «Ваша Луна»: от общей Луны на небе к своей, в натальной карте. Без цен: платный разбор стоит под результатом калькулятора.
// art — гравюра знака Луны на сегодня (только на «Луне сегодня»), на страницах без неё блок обходится текстом
export function MoonNatalBridge({ from, signName, art }: { from: BridgeFrom; signName?: string; art?: string | null }) {
  const id = useId();
  const copy = bridgeCopy(from, signName);
  return (
    <section className="moon-bridge" data-from={from} aria-labelledby={`${id}-title`}>
      {art && (
        <div className="moon-bridge__art">
          <Image src={art} alt="" width={160} height={160} unoptimized loading="lazy" />
        </div>
      )}
      <div className="moon-bridge__body">
        <p className="moon-bridge__eyebrow">{copy.eyebrow}</p>
        <h2 id={`${id}-title`}>{copy.title}</h2>
        <p className="moon-bridge__text">{copy.text}</p>
        <Link className="button button--lavender moon-bridge__cta" href={copy.href} onClick={() => reachGoal("moon_to_natal", { from })}>{copy.cta}</Link>
        <p className="moon-bridge__note">{BRIDGE_NOTE}</p>
      </div>
    </section>
  );
}
