import Link from "next/link";
import { LILA_SESSION_PRICE_KOPECKS } from "@oracle/core";
import { ConclusionView } from "@/components/lila/ConclusionView";
import { Icon } from "@/components/Icon";
import { DISCLAIMER, formatRubles } from "@/lib/legal";
import { breadcrumbJsonLd, jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { DEMO_CONCLUSION, DEMO_INTENTION, DEMO_MOVES } from "@/server/product-demos";
import styles from "./primer.module.css";

export const metadata = publicMetadata({ title: "Пример итога Лилы с проводником", description: "Демонстрационный итог Лилы: намерение, путь, повторы, записи и шаг на неделю. Четыре главы и пример PDF без регистрации.", path: "/lila/primer", image: SITE_PREVIEW_IMAGE });

export default function LilaExamplePage() {
  return (
    <main className={styles.report}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: "Лила", path: "/lila" }, { name: "Пример итога", path: "/lila/primer" }])) }} />
      <header className={styles.intro}>
        <p className={styles.demoLabel}>Вымышленная демонстрационная партия</p>
        <h1>Пример итога Лилы</h1>
        <p className={styles.intention}><span>Намерение</span>«{DEMO_INTENTION}»</p>
        <div className={styles.description}>
          <p>Этот пример показывает четыре главы и PDF после завершения партии с проводником. Он собран из фактов вымышленной партии и готовых текстов клеток — так получается итог, если ИИ недоступен. Персональные формулировки с ИИ могут отличаться. Здесь нет реальных записей пользователя.</p>
          <p>Проводник — {formatRubles(LILA_SESSION_PRICE_KOPECKS)} за одну новую партию, оплата до начала. В бесплатном режиме остаются поле, вопросы и ваши записи.</p>
        </div>
        <a className="button button--ghost" href="/examples/lila.pdf" download>Скачать пример PDF</a>
      </header>
      <div className={styles.chapters}>
        <ConclusionView chapters={DEMO_CONCLUSION} />
      </div>
      <details className={styles.moves}>
        <summary>Ходы демонстрационной партии · {DEMO_MOVES.length}</summary>
        <ol>
          {DEMO_MOVES.map((move) => (
            <li key={move.n}>Кубик: {move.roll}; клетка: {move.to}{move.note ? `; запись: «${move.note}»` : ""}.</li>
          ))}
        </ol>
      </details>
      <div className={styles.closing}>
        <Link className="button" href="/lila/igra">Играть <Icon name="arrow-right" /></Link>
        <p className="muted">{DISCLAIMER}</p>
      </div>
    </main>
  );
}
