import { ARCANA, SECTION_TITLES } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { BLOG_PATH } from "@/lib/blog";
import { ARCANA_HUB_PATH, arcanumImage, arcanumPath, shortDescription } from "@/lib/arcana-paths";
import { SITE_URL } from "@/lib/site";

export const ARCANA_HUB_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "Сколько арканов в матрице судьбы?",
    answer: "Двадцать два: номера от 1 до 22, как у старших арканов Таро. Если число получилось больше 22, цифры складывают, пока не выйдет номер от 1 до 22.",
  },
  {
    question: "Как найти свой аркан?",
    answer: "Рассчитайте матрицу по дате рождения: на диаграмме вы увидите номера арканов во всех точках. Подробно разобраны личность, центр и задача, а значение любого аркана можно открыть на этой странице.",
  },
  {
    question: "Есть ли «плохие» арканы?",
    answer: "Нет. У каждого аркана есть светлая и сложная стороны, и обе описаны на его странице: в разделах «В ресурсе» и «В перекосе». Это образы для размышления, а не оценка.",
  },
  {
    question: "Чем арканы матрицы отличаются от карт Таро?",
    answer: "Образы и номера те же, что у старших арканов Таро, но в матрице они привязаны к датам и позициям диаграммы, а в Таро — к карте, которую вы вытягиваете. Поэтому тексты на сайте разные.",
  },
  {
    question: "Предсказывают ли арканы события?",
    answer: "Нет. Мы читаем арканы как символы для самопознания: на странице каждого — вопрос для себя и действие на сегодня, а не прогноз.",
  },
];

export function arcanaHubJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Значения арканов в матрице судьбы",
        url: `${SITE_URL}${ARCANA_HUB_PATH}`,
        inLanguage: "ru",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: ARCANA.length,
          itemListElement: ARCANA.map((arcanum, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `Аркан ${arcanum.number} ${arcanum.name}`,
            url: `${SITE_URL}${arcanumPath(arcanum)}`,
          })),
        },
      },
      {
        "@type": "FAQPage",
        inLanguage: "ru",
        mainEntity: ARCANA_HUB_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
    ],
  };
}

const PAGE_SECTIONS = [SECTION_TITLES.essence, SECTION_TITLES.personality, SECTION_TITLES.center, SECTION_TITLES.task, SECTION_TITLES.love, SECTION_TITLES.money];

// Каталог всех 22 арканов: ключевые слова и суть образа с переходом на страницу аркана
export function ArcanaHubGrid() {
  return (
    <ul className="arcana-hub__grid" aria-label="Все 22 аркана">
      {ARCANA.map((arcanum) => (
        <li key={arcanum.number}>
          <Link className="arcana-hub__card" href={arcanumPath(arcanum)}>
            <span className="arcana-hub__art">
              <Image src={arcanumImage(arcanum, "card")} alt="" fill unoptimized sizes="(min-width: 900px) 220px, 40vw" />
            </span>
            <span className="arcana-hub__head">
              <b>{String(arcanum.number).padStart(2, "0")}</b>
              <span className="arcana-hub__name">{arcanum.name}</span>
            </span>
            <span className="arcana-hub__keys">{arcanum.keywords.join(" · ")}</span>
            <span className="arcana-hub__text">{shortDescription(arcanum.essence[0] ?? arcanum.name)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ArcanaHubGuide() {
  return (
    <>
      <section className="arcana-hub__how" aria-labelledby="hub-how">
        <h2 id="hub-how">Как читать значение аркана</h2>
        <p>
          На странице каждого аркана собраны одни и те же разделы: {PAGE_SECTIONS.join(", ")}, а также ресурс, перекос, действие на сегодня и вопрос для себя.
          Начните с раздела «{SECTION_TITLES.essence}», затем откройте тот, который отвечает вашей позиции в матрице.
        </p>
        <p>
          Аркан в позиции личности описывает, как вас видят. Аркан в центре — то, на что вы опираетесь. Аркан в позиции задачи — тема, к которой
          стоит присмотреться. Один и тот же образ звучит по-разному в разных точках, поэтому сначала{" "}
          <Link className="matrix-link" href="/matrica-sudby">рассчитайте свою матрицу</Link>, а потом читайте нужные арканы.
        </p>
        <p>
          Трактовки — гипотезы для размышления, а не оценка и не прогноз. Подробнее о том, как складывается диаграмма, — в статьях{" "}
          <Link className="matrix-link" href={`${BLOG_PATH}/chto-takoe-matritsa-sudby`}>«Что такое матрица судьбы»</Link> и{" "}
          <Link className="matrix-link" href={`${BLOG_PATH}/rasshifrovka-matritsy-sudby`}>«Расшифровка матрицы судьбы»</Link>.
        </p>
      </section>

      <section className="arcana-hub__faq" aria-labelledby="hub-faq">
        <h2 id="hub-faq">Частые вопросы об арканах</h2>
        <div className="matrix-faq__list">
          {ARCANA_HUB_FAQ.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
