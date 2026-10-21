import { LILA_CELLS } from "@oracle/content/lila";
import { LILA_SESSION_PRICE_KOPECKS, LILA_SESSION_PRODUCT } from "@oracle/core";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Board } from "@/components/lila/Board";
import { CellArt } from "@/components/lila/CellArt";
import { LilaFaq, lilaFaqJsonLd } from "@/components/lila/LilaFaq";
import { Scene } from "@/components/Scene";
import { DISCLAIMER, formatRubles } from "@/lib/legal";
import { lilaCellPath, LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
import { jsonLdScript, lilaGameJsonLd, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { availableCellImages } from "@/server/lila-images";
import { salesEnabled } from "@/server/payments-deps";

export const metadata: Metadata = publicMetadata({
  title: "Игра Лила онлайн — играть бесплатно, поле из 72 клеток",
  description: "Играйте в Лилу онлайн бесплатно и без регистрации: сформулируйте намерение, бросайте кубик и проходите 72 клетки, у каждой тема, вопрос и ваша запись.",
  path: LILA_PATH,
  absoluteTitle: true,
  image: SITE_PREVIEW_IMAGE,
});

// Продажа зависит от настроек работающего сервера, а не окружения сборки.
export const dynamic = "force-dynamic";

export default function LilaPage() {
  const images = availableCellImages();
  const guided = salesEnabled(LILA_SESSION_PRODUCT);
  return (
    <Scene art={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(lilaGameJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(lilaFaqJsonLd(guided)) }} />
      <div className="lila-hero">
        <div className="scene__intro stack">
          <p className="eyebrow eyebrow--line">Практика</p>
          <h1 className="display">Игра Лила онлайн — путь по 72 клеткам</h1>
          <p className="lead">
            Сформулируйте намерение, бросайте кубик и проходите путь по 72 клеткам: у каждой — тема, вопрос и, при желании, ваша запись. Это способ посмотреть на свой вопрос по-новому, а не предсказание.
          </p>
          <p className="row">
            <Link className="button" href={LILA_GAME_PATH}>
              Играть
            </Link>
            <a className="button button--ghost" href="#how">
              Как это устроено
            </a>
          </p>
          <p className="muted">Без регистрации · партия сохраняется в вашем браузере</p>
        </div>
        <Image className="lila-hero__art" src="/practices/lila.webp" alt="" width={1200} height={675} unoptimized priority />
      </div>

      <section className="card stack" id="how" aria-labelledby="how-title">
        <h2 id="how-title">Как играть</h2>
        <ol>
          <li>Выберите намерение — один личный вопрос, к которому вы готовы возвращаться.</li>
          <li>Бросайте кубик. Чтобы начать, нужна шестёрка.</li>
          <li>На каждой клетке — короткий текст и вопрос для размышления. Записать мысль можно, но не обязательно.</li>
          <li>Стрелы поднимают на другую клетку, змеи возвращают к теме, которая просит внимания. Цель пути — клетка 68, попасть на неё можно только точным броском.</li>
        </ol>
      </section>

      <section className="card stack" aria-labelledby="not-title">
        <h2 id="not-title">Чем Лила не является</h2>
        <ul>
          <li>Не гадание: клетки не говорят, что произойдёт, а задают вопросы для размышления.</li>
          <li>Не чат: порядок игры задают поле и кубик, а вы сами решаете, что записать.</li>
          <li>Не замена психолога или врача: игра помогает собрать мысли, но не лечит и не ставит оценок.</li>
        </ul>
      </section>

      {guided && <section className="card stack" aria-labelledby="modes-title">
        <h2 id="modes-title">Два способа играть</h2>
        <div className="lila-modes">
          <div className="stack"><h3>Без проводника · бесплатно</h3><p>Поле, кубик, тексты клеток, три вопроса для повторных визитов и ваши записи. Можно начать без регистрации. Гостевая партия хранится в браузере; через VK ID её можно сохранить в портрете.</p><p><Link className="button button--ghost" href={LILA_GAME_PATH}>Играть бесплатно</Link></p></div>
          <div className="stack"><h3>С проводником · {formatRubles(LILA_SESSION_PRICE_KOPECKS)}</h3><p>Одна новая партия. ИИ связывает ходы с намерением. После завершения — четыре главы: «Намерение и путь», «Что повторялось», «Что вы замечали», «Вывод и шаг на неделю», а также PDF.</p><p>Вход через VK ID и разовая оплата до начала. Намерение и записи передаются GigaChat для подготовки текста. Если ИИ недоступен, итог собирается из фактов и готовых описаний.</p><p><Link className="button button--lavender" href={LILA_GAME_PATH}>Играть с проводником · {formatRubles(LILA_SESSION_PRICE_KOPECKS)}</Link></p><p className="muted">Сначала формулируете вопрос, оплата — на следующем шаге.</p><Link className="text-link" href="/lila/primer">Посмотреть пример итога и PDF</Link></div>
        </div>
        <p className="muted">В обоих режимах одинаковые правила поля. Проводник предлагает гипотезы для размышления и не предсказывает исход вашего вопроса.</p>
      </section>}

      <section className="stack" aria-labelledby="field">
        <h2 id="field">Поле Лилы</h2>
        <Board current={1} variant="full" />
        <Board current={1} variant="compact" />
      </section>

      <section className="card stack" aria-labelledby="cells">
        <h2 id="cells">72 клетки</h2>
        <ul className="lila-cell-grid">
          {LILA_CELLS.map((cell) => (
            <li key={cell.number}>
              <Link className="lila-tile" href={lilaCellPath(cell)}>
                <span className="lila-tile__art">
                  <CellArt cell={cell} size="thumb" available={images} decorative />
                  <span className="lila-tile__number">{cell.number}</span>
                </span>
                <span className="lila-tile__sep"> · </span>
                <span className="lila-tile__name">{cell.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LilaFaq guided={guided} />

      <p className="muted">{DISCLAIMER}</p>
    </Scene>
  );
}
