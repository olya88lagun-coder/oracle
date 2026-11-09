import { BODY_NAMES, natalHousePageName, NATAL_SECTION_TITLES, SIGN_NAMES, type NatalHousePageRef, type NatalPageRef, type NatalPageText } from "@oracle/content/natal";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  bodyInHousesTitle,
  DISCLAIMER,
  HOUSE_NEIGHBORS_TITLE,
  HOUSE_NEXT,
  HOUSE_OTHER_HOUSES_TITLE,
  HOUSE_PREVIOUS,
  houseEmblemCaption,
  houseEmblemLabel,
  meaningEmblemLabel,
  MEANING_BREADCRUMBS_LABEL,
  MEANING_CTA_TEXT,
  MEANING_CTA_TITLE,
  meaningCoverAlt,
  MEANING_CURRENT_PAGE,
  MEANING_EYEBROW,
  MEANING_HERO_LINK,
  MEANING_NEIGHBORS_TITLE,
  MEANING_NEXT,
  MEANING_OTHER_SIGNS_TITLE,
  MEANING_PREVIOUS,
  MEANING_TOC_LABEL,
  MEANING_TOC_TITLE,
  NATAL_TITLE,
  NODE_OTHER_SIGNS_TITLE,
  SIGN_NAMES_GENITIVE,
} from "@/lib/natal-copy";
import { natalCoverPath, NATAL_COVER_SIZE } from "@/lib/natal-covers";
import { houseNeighborPages, neighborPages, sameBodyHousePages, sameBodyPages } from "@/lib/natal-pages";
import { NATAL_PATH, natalPagePath } from "@/lib/natal-paths";
import { NatalCalculatorLink } from "./NatalCalculatorLink";
import { bodyGlyphId, NatalGlyph } from "./NatalGlyph";
import { NatalNodeAxis } from "./NatalNodeAxis";
import { NatalSprite } from "./NatalSprite";

// Страница значения («Солнце в Овне», «Асцендент в Раке»). Разметка и классы — по макету natal-page.html; оформление добавляет дизайн.
// Один <h1>; оглавление, пять разделов, приглашение рассчитать карту, ссылки на тот же объект в других знаках и на соседние знаки.
// Страница «планета в доме» («Венера в 7 доме») — та же вёрстка: вместо знаков — открытые дома того же тела; у страницы знака планеты — блок «<тело> в домах», если дома открыты.

const SECTION_KEYS = ["essence", "manifestation", "pitfalls", "questions", "limits"] as const;

type AnyPage = NatalPageRef | NatalHousePageRef;
type Reading = Pick<NatalPageText, "name" | "keywords" | "essence" | "manifestation" | "pitfalls" | "questions" | "limits">;

const titleOf = (item: AnyPage): string =>
  item.kind === "house" ? natalHousePageName(item.body, item.house) : `${BODY_NAMES[item.body].name} ${SIGN_NAMES[item.sign].preposition} ${SIGN_NAMES[item.sign].prepositional}`;

// Значок пункта в сетке «в других знаках / домах»: глиф знака или номер дома
const ItemMark = ({ item }: { item: AnyPage }) =>
  item.kind === "house" ? (
    <span className="natal-signs-grid__house" aria-hidden="true">
      {item.house}
    </span>
  ) : (
    <NatalGlyph id={item.sign} />
  );

// Обложек у страниц домов нет: глиф планеты и номер дома
function HouseEmblem({ page }: { page: NatalHousePageRef }) {
  const body = BODY_NAMES[page.body].name;
  return (
    <figure className="natal-emblem" data-variant={bodyGlyphId(page.body)} role="img" aria-label={houseEmblemLabel(body, page.house)}>
      <div className="natal-emblem__pair">
        <NatalGlyph id={bodyGlyphId(page.body)} />
        <span className="natal-emblem__divider" aria-hidden="true" />
        <span className="natal-emblem__axis" aria-hidden="true">
          {page.house}
        </span>
      </div>
      <figcaption>
        {body} · {houseEmblemCaption(page.house)}
      </figcaption>
    </figure>
  );
}

function Emblem({ page }: { page: NatalPageRef }) {
  const ascendant = page.body === "ascendant";
  const body = BODY_NAMES[page.body].name;
  return (
    <figure className="natal-emblem" data-variant={ascendant ? "asc" : bodyGlyphId(page.body)} role="img" aria-label={meaningEmblemLabel(body, SIGN_NAMES_GENITIVE[page.sign])}>
      <div className="natal-emblem__pair">
        {ascendant ? (
          <span className="natal-emblem__axis" aria-hidden="true">
            AC
          </span>
        ) : (
          <NatalGlyph id={bodyGlyphId(page.body)} />
        )}
        <span className="natal-emblem__divider" aria-hidden="true" />
        <NatalGlyph id={page.sign} />
      </div>
      <figcaption>
        {body} · {SIGN_NAMES[page.sign].nominative}
      </figcaption>
    </figure>
  );
}

// cover по умолчанию берётся из списка обложек; тесты передают null, чтобы проверять эмблему, не завися от того, у каких знаков уже есть картинки
export function NatalPageView({ page, text, cover = natalCoverPath(page.slug) }: { page: AnyPage; text: Reading; cover?: string | null }) {
  const house = page.kind === "house";
  const { previous, next }: { previous: AnyPage | undefined; next: AnyPage | undefined } = page.kind === "house" ? houseNeighborPages(page) : neighborPages(page);
  const siblings: AnyPage[] = page.kind === "house" ? sameBodyHousePages(page.body) : sameBodyPages(page);
  // Со страницы «планета в знаке» — ссылки на открытые дома той же планеты; пока партия домов не принята, блока нет
  const housePages = page.kind === "planet" && page.body !== "ascendant" && page.body !== "northNode" ? sameBodyHousePages(page.body) : [];
  const id = (key: string) => `${page.body}-${key}`;
  const paragraphs = (items: readonly string[]): ReactNode => items.map((paragraph) => <p key={paragraph}>{paragraph}</p>);
  const sections: Record<(typeof SECTION_KEYS)[number], ReactNode> = {
    essence: paragraphs(text.essence),
    manifestation: paragraphs(text.manifestation),
    pitfalls: paragraphs(text.pitfalls),
    questions: (
      <ul className="natal-questions">
        {text.questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    ),
    limits: <p>{text.limits}</p>,
  };

  return (
    <main className="natal-meaning">
      <NatalSprite />
      <nav className="natal-breadcrumbs" aria-label={MEANING_BREADCRUMBS_LABEL}>
        <ol>
          <li>
            <Link href={NATAL_PATH}>{NATAL_TITLE}</Link>
          </li>
          <li className="natal-breadcrumbs__divider" aria-hidden="true">
            ›
          </li>
          <li aria-current="page">{text.name}</li>
        </ol>
      </nav>
      <header className="natal-meaning-hero">
        <div>
          <p className="natal-meaning-hero__eyebrow">{MEANING_EYEBROW[page.kind]}</p>
          <h1 id="meaning-title">{text.name}</h1>
          <p className="natal-meaning-hero__intro">{text.keywords.join(" · ").replace(/^./, (letter) => letter.toUpperCase())}</p>
          <NatalCalculatorLink className="natal-meaning-hero__link" label={MEANING_HERO_LINK} />
        </div>
        {cover ? (
          <figure className="natal-cover">
            <Image src={cover} width={NATAL_COVER_SIZE} height={NATAL_COVER_SIZE} alt={meaningCoverAlt(text.name)} priority unoptimized />
          </figure>
        ) : page.kind === "house" ? (
          <HouseEmblem page={page} />
        ) : (
          <Emblem page={page} />
        )}
      </header>
      <article aria-labelledby="meaning-title">
        {page.kind !== "house" && <NatalNodeAxis page={page} idPrefix={page.body} />}
        <div className="natal-reading-layout">
          <aside className="natal-toc" aria-label="Оглавление">
            <p className="natal-toc__title">{MEANING_TOC_TITLE}</p>
            <nav aria-label={MEANING_TOC_LABEL}>
              {SECTION_KEYS.map((key) => (
                <a key={key} href={`#${id(key)}`}>
                  {NATAL_SECTION_TITLES[key]}
                </a>
              ))}
            </nav>
          </aside>
          <div className="natal-sections">
            {SECTION_KEYS.map((key) => (
              <section key={key} className="natal-section" aria-labelledby={id(key)}>
                <h2 id={id(key)}>{NATAL_SECTION_TITLES[key]}</h2>
                {sections[key]}
              </section>
            ))}
          </div>
        </div>
        <section className="natal-page-cta" aria-labelledby={id("calculate")}>
          <div>
            <h2 id={id("calculate")}>{MEANING_CTA_TITLE}</h2>
            <p>{MEANING_CTA_TEXT}</p>
          </div>
          <NatalCalculatorLink />
        </section>
        <section className="natal-other-signs" aria-labelledby={id("other-signs")}>
          <h2 id={id("other-signs")}>{house ? HOUSE_OTHER_HOUSES_TITLE : page.kind === "node" ? NODE_OTHER_SIGNS_TITLE : MEANING_OTHER_SIGNS_TITLE}</h2>
          <div className="natal-signs-grid">
            {siblings.map((item) => {
              const current = item.slug === page.slug;
              return (
                <Link key={item.slug} className="natal-signs-grid__item" href={natalPagePath(item)} aria-current={current ? "page" : undefined}>
                  <ItemMark item={item} />
                  <span>{titleOf(item)}</span>
                  {current && <span className="sr-only">{MEANING_CURRENT_PAGE}</span>}
                </Link>
              );
            })}
          </div>
        </section>
        {housePages.length > 0 && (
          <section className="natal-other-signs" aria-labelledby={id("houses")}>
            <h2 id={id("houses")}>{bodyInHousesTitle(BODY_NAMES[page.body].name)}</h2>
            <div className="natal-signs-grid">
              {housePages.map((item) => (
                <Link key={item.slug} className="natal-signs-grid__item" href={natalPagePath(item)} prefetch={false}>
                  <ItemMark item={item} />
                  <span>{titleOf(item)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section className="natal-neighbors" aria-labelledby={id("neighbors")}>
          <h2 id={id("neighbors")}>{house ? HOUSE_NEIGHBORS_TITLE : MEANING_NEIGHBORS_TITLE}</h2>
          <nav className="natal-pager" aria-label={house ? HOUSE_NEIGHBORS_TITLE : MEANING_NEIGHBORS_TITLE}>
            {previous && (
              <Link href={natalPagePath(previous)}>
                <span className="natal-pager__arrow" aria-hidden="true">
                  ←
                </span>
                <span>
                  <span className="natal-pager__label">{house ? HOUSE_PREVIOUS : MEANING_PREVIOUS}</span>
                  {titleOf(previous)}
                </span>
              </Link>
            )}
            {next && (
              <Link href={natalPagePath(next)}>
                <span>
                  <span className="natal-pager__label">{house ? HOUSE_NEXT : MEANING_NEXT}</span>
                  {titleOf(next)}
                </span>
                <span className="natal-pager__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            )}
          </nav>
        </section>
      </article>
      <p className="natal-disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
