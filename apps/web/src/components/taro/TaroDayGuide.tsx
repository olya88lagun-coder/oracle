import { TAROT_CARDS } from "@oracle/content/tarot";
import Link from "next/link";
import { TaroMatrixBridge } from "@/components/taro/TaroMatrixBridge";
import { SITE_URL } from "@/lib/site";
import { rankLabel } from "@/lib/taro-catalog";
import { TARO_AUTHOR_CREDIT, TARO_DAY_PATH, TARO_PATH, TARO_SPREADS_PATH, taroCardPath } from "@/lib/taro-paths";

export const TARO_DAY_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "Что такое карта дня в Таро?",
    answer: "Это одна карта на сегодня. Она не предсказывает события, а даёт образ, небольшое действие и вопрос, с которыми удобно посмотреть на свой день.",
  },
  {
    question: "Это гадание?",
    answer:
      "По привычке такую практику называют гаданием на карту дня, но будущее мы узнать не обещаем. Карта здесь — символ: она помогает заметить, как вы относитесь к дню, и задать себе вопрос.",
  },
  {
    question: "Как выбирается карта дня?",
    answer: "Случайно, из всех 78 карт колоды. Три рубашки на экране нужны для самого выбора: под любой из них карта определяется случайно, поэтому выбирайте не раздумывая.",
  },
  {
    question: "Как часто можно вытягивать карту дня?",
    answer: "Один раз в сутки. До полуночи по московскому времени страница показывает ту же карту, а на следующий день можно вытянуть новую.",
  },
  {
    question: "Нужна ли регистрация и сохраняется ли карта?",
    answer:
      "Регистрация не нужна. Карта запоминается только в вашем браузере, на сервер мы её не отправляем. Если очистить данные сайта или открыть страницу на другом устройстве, карту можно вытянуть заново.",
  },
  {
    question: "Чем карта дня отличается от расклада?",
    answer: "Карта дня — одна карта на сутки: образ, действие и вопрос для себя. Расклад — несколько карт, каждая в своей позиции, он помогает рассмотреть вопрос с разных сторон. Расклады Таро тоже бесплатные и без регистрации.",
  },
  {
    question: "Какая колода используется и бывают ли перевёрнутые карты?",
    answer: `Классическая колода Райдер–Уэйт: 22 старших аркана и 56 младших. Все карты показаны в прямом положении, перевёрнутых значений здесь нет. ${TARO_AUTHOR_CREDIT}.`,
  },
];

export const TARO_DAY_STEPS: readonly { title: string; text: string }[] = [
  { title: "Выберите карту утром.", text: "Остановитесь на одной из трёх рубашек, не раздумывая долго: карта под любой из них определяется случайно." },
  { title: "Прочитайте трактовку один раз.", text: "Не ищите правильный смысл. Заметьте, что в описании откликнулось, а что нет." },
  { title: "Возьмите действие дня.", text: "Оно небольшое, и его можно сделать в обычный день." },
  { title: "Вечером вернитесь к вопросу.", text: "Подумайте, что вы заметили за день и изменилось ли что-то в вашем взгляде на ситуацию." },
];

export function taroDayFaqJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: TARO_DAY_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function taroDayBreadcrumbsJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Таро", item: `${SITE_URL}${TARO_PATH}` },
      { "@type": "ListItem", position: 2, name: "Карта дня", item: `${SITE_URL}${TARO_DAY_PATH}` },
    ],
  };
}

const MAJOR_ARCANA = TAROT_CARDS.filter((card) => card.suit === "major");

// Текст под выбором карты: что это, как пользоваться, переходы к значениям карт и вопросы. Рендерится на сервере целиком
export function TaroDayGuide() {
  return (
    <div className="taro-day-info">
      <section aria-labelledby="taro-day-what">
        <h2 id="taro-day-what">Что такое карта дня Таро</h2>
        <p>
          Карта дня в Таро — короткая практика на одну карту. Вы выбираете одну из трёх закрытых карт и получаете образ дня: что он может сказать о вашем настроении, какое небольшое действие стоит сделать сегодня и какой
          вопрос задать себе вечером.
        </p>
        <p>
          Мы используем классическую колоду Райдер–Уэйт. 22 старших аркана говорят о больших жизненных темах, 56 младших — о повседневных делах, чувствах и решениях. Такой формат часто называют гаданием на карту дня, но мы не
          обещаем узнать будущее и не заменяем совет врача, юриста или психолога. Карта даёт повод остановиться и посмотреть на день внимательнее.
        </p>
      </section>

      <section aria-labelledby="taro-day-how">
        <h2 id="taro-day-how">Как пользоваться картой дня</h2>
        <ol className="taro-day-steps">
          {TARO_DAY_STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong> {step.text}
            </li>
          ))}
        </ol>
        <p>Хотите посмотреть на вопрос глубже? Одной карты может быть мало.</p>
        <p>
          <Link className="touch-link" href={TARO_SPREADS_PATH}>
            Расклады Таро на три карты, отношения и выбор
          </Link>
        </p>
      </section>

      <TaroMatrixBridge context="day" id="taro-day-bridge" />

      <section aria-labelledby="taro-day-arcana">
        <h2 id="taro-day-arcana">Карты дня по старшим арканам</h2>
        <p>У каждой карты есть подробное значение: суть, отношения, дело и деньги, ресурс и сложная сторона. Откройте карту, которая выпала, или посмотрите всю колоду.</p>
        <ul className="taro-day-arcana">
          {MAJOR_ARCANA.map((card) => (
            <li key={card.slug}>
              <Link href={taroCardPath(card)} prefetch={false}>
                <span aria-hidden="true">{rankLabel(card.suit, card.rank)}</span>
                {card.name}
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link className="touch-link" href={`${TARO_PATH}#znacheniya`}>
            Значения всех 78 карт
          </Link>
        </p>
      </section>

      <section className="matrix-faq" aria-labelledby="taro-day-faq">
        <h2 id="taro-day-faq">Частые вопросы о карте дня</h2>
        <div className="matrix-faq__list">
          {TARO_DAY_FAQ.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
