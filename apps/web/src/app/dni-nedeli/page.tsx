import type { Metadata } from "next";
import Link from "next/link";
import { MoonRibbon } from "@/components/moon/MoonRibbon";
import { moonRibbonData } from "@/lib/moon-ribbon";
import { MoonNatalBridge } from "@/components/moon/MoonNatalBridge";
import { WeekdayCards } from "@/components/weekday/WeekdayCards";
import { WeekdayNow } from "@/components/weekday/WeekdayNow";
import { WeekdayWeekBar } from "@/components/weekday/WeekdayWeekBar";
import { WeekdayWheel } from "@/components/weekday/WeekdayWheel";
import { DISCLAIMER } from "@/lib/legal";
import { currentMonthPath } from "@/lib/lunar-calendar-paths";
import { MOON_PATH } from "@/lib/moon-paths";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { TARO_DAY_PATH } from "@/lib/taro-paths";
import { WEEKDAY_FAQ, WEEKDAY_PATH, weekdayIndex, WEEKDAY_PLANETS } from "@/lib/weekday-planets";

export const metadata: Metadata = publicMetadata({
  title: "Дни недели и планеты: ритм недели",
  description: "Какая планета покровительствует каждому дню недели: образ дня, вопрос для себя и ссылка на практику. Луна, Марс, Меркурий, Юпитер, Венера, Сатурн, Солнце. Не прогноз.",
  path: WEEKDAY_PATH,
  image: SITE_PREVIEW_IMAGE,
});

// День недели считаем по Москве в момент запроса, как на «Луне сегодня»: с ISR первый посетитель после полуночи увидел бы вчерашний день
export const dynamic = "force-dynamic";

export default function WeekdayPage() {
  const today = weekdayIndex(new Date());
  const planet = WEEKDAY_PLANETS[today]!;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: "Дни недели и планеты", url: `${SITE_URL}${WEEKDAY_PATH}`, inLanguage: "ru" },
      { "@type": "FAQPage", mainEntity: WEEKDAY_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Дни недели и планеты", item: `${SITE_URL}${WEEKDAY_PATH}` },
      ] },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
      <main className="moon-page weekday-page">
        <MoonRibbon current="weekday" now={new Date()} initial={moonRibbonData(new Date())} />
        <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Дни недели и планеты</span></nav>
        <header className="weekday-hero">
          <div className="weekday-hero__copy">
            <p className="eyebrow eyebrow--line">Ритм недели</p>
            <h1>Дни недели и планеты</h1>
            <p className="weekday-hero__lead">В классической традиции каждому дню недели покровительствует своя планета. Её образ не разрешает и не запрещает вам ничего, он служит мягкой подсказкой: на чём сегодня можно задержать внимание.</p>
            <WeekdayNow planet={planet} />
          </div>
          <WeekdayWheel today={today} />
        </header>
        <WeekdayWeekBar today={today} />
        <section className="weekday-week" aria-labelledby="weekday-week-title">
          <h2 id="weekday-week-title">Архетипы планет-покровителей</h2>
          <p className="weekday-week__lead">Мы не считаем, что планета «разрешает» или «запрещает» вам какие-то действия. Но её архетип может подсказать, на какой фокус внимания сегодня стоит опереться.</p>
          <WeekdayCards today={today} />
        </section>
        <MoonNatalBridge from="weekday" />
        <section className="moon-links" aria-labelledby="weekday-links-title">
          <h2 id="weekday-links-title">Продолжить</h2>
          <ul>
            <li><Link className="touch-link" href={MOON_PATH}>Луна сегодня</Link></li>
            <li><Link className="touch-link" href={currentMonthPath(new Date())}>Лунный календарь на месяц</Link></li>
            <li><Link className="touch-link" href={TARO_DAY_PATH}>Вытянуть карту дня</Link></li>
          </ul>
        </section>
        <section className="moon-faq" aria-labelledby="weekday-faq-title">
          <h2 id="weekday-faq-title">Вопросы о днях недели и планетах</h2>
          {WEEKDAY_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </section>
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
