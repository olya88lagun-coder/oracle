import type { NatalChart } from "@oracle/core/natal";
import Link from "next/link";
import { quickAnswer, type QuickVariant } from "@/lib/natal-quick-pages";
import type { NatalKeyRegistry } from "@/lib/natal-texts";

export const ANSWER_EYEBROW = "Ваш результат";

// Ответ на странице быстрого расчёта: знак асцендента или Луны сразу над картой (lib/natal-quick-pages.ts)
export function NatalAnswer({ chart, variant, registry }: { chart: NatalChart; variant: QuickVariant; registry?: NatalKeyRegistry }) {
  const answer = quickAnswer(chart, variant, registry);
  return (
    <section className="natal-answer" data-variant={variant}>
      <p className="natal-answer__eyebrow">{ANSWER_EYEBROW}</p>
      <h3 className="natal-answer__title">{answer.title}</h3>
      {answer.detail && <p className="natal-answer__detail">{answer.detail}</p>}
      <p className="natal-answer__text">{answer.text}</p>
      {answer.note && <p className="natal-answer__note">{answer.note}</p>}
      {answer.link && (
        <Link className="natal-answer__link" href={answer.link.href} prefetch={false}>
          {answer.link.label}
        </Link>
      )}
    </section>
  );
}
