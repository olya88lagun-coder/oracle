import Link from "next/link";
import { LILA_SESSION_PRICE_KOPECKS } from "@oracle/core";
import { ConclusionView } from "@/components/lila/ConclusionView";
import { DISCLAIMER, formatRubles } from "@/lib/legal";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { DEMO_CONCLUSION, DEMO_INTENTION, DEMO_MOVES } from "@/server/product-demos";

export const metadata = publicMetadata({ title: "Пример итога Лилы с проводником", description: "Демонстрационный итог Лилы: намерение, путь, повторы, записи и шаг на неделю. Четыре главы и пример PDF без регистрации.", path: "/lila/primer", image: SITE_PREVIEW_IMAGE });

export default function LilaExamplePage() {
  return <main className="workspace"><div className="matrix-wrap stack source-content">
    <p className="eyebrow">Вымышленная демонстрационная партия</p>
    <h1>Пример итога Лилы</h1>
    <p className="lead">Намерение: «{DEMO_INTENTION}».</p>
    <p>Этот пример показывает четыре главы и PDF после завершения партии с проводником. Он собран из фактов вымышленной партии и готовых текстов клеток — так получается итог, если ИИ недоступен. Персональные формулировки с ИИ могут отличаться. Здесь нет реальных записей пользователя.</p>
    <p>Проводник — {formatRubles(LILA_SESSION_PRICE_KOPECKS)} за одну новую партию, оплата до начала. В бесплатном режиме остаются поле, вопросы и ваши записи.</p>
    <p><a className="button button--ghost" href="/examples/lila.pdf" download>Скачать пример PDF</a></p>
    <ConclusionView chapters={DEMO_CONCLUSION} />
    <details className="card"><summary>Ходы демонстрационной партии · {DEMO_MOVES.length}</summary><ol>{DEMO_MOVES.map((move) => <li key={move.n}>Кубик: {move.roll}; клетка: {move.to}{move.note ? `; запись: «${move.note}»` : ""}.</li>)}</ol></details>
    <p className="muted">{DISCLAIMER}</p>
    <p><Link className="button" href="/lila/igra">Играть</Link></p>
  </div></main>;
}
