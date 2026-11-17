import type { Metadata } from "next";
import Link from "next/link";
import { MoonDisc } from "@/components/moon/MoonDisc";
import { MoonStrip } from "@/components/moon/MoonStrip";
import { DISCLAIMER } from "@/lib/legal";
import { buildMoonToday, MOON_FAQ, MOON_PATH } from "@/lib/moon-today";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: "Луна сегодня: фаза, знак, лунные сутки",
  description: "Какая сегодня Луна: фаза и освещённость, знак зодиака, лунные сутки, восход и заход по Москве и фазы на 14 дней вперёд. Бесплатно, без регистрации.",
  path: MOON_PATH,
});

// Страница зависит от момента запроса: с ISR первый посетитель после просрочки получил бы вчерашнюю Луну. Расчёт занимает миллисекунды
export const dynamic = "force-dynamic";

export default function MoonTodayPage() {
  const today = buildMoonToday(new Date());
  const { snapshot } = today;
  const percent = Math.round(snapshot.illumination * 100);
  const hasTexts = Boolean(today.texts.phase || today.texts.day);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: `Луна сегодня, ${today.dateLabel}`, url: `${SITE_URL}${MOON_PATH}`, inLanguage: "ru" },
      { "@type": "FAQPage", mainEntity: MOON_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Луна сегодня", item: `${SITE_URL}${MOON_PATH}` },
      ] },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
      <main className="moon-page">
        <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Луна сегодня</span></nav>
        <header className="moon-hero">
          <h1>Луна сегодня, {today.dateLabel}</h1>
          <p className="moon-hero__place">По Москве</p>
          <figure className="moon-disc" data-phase={snapshot.phase} data-waxing={snapshot.waxing ? "true" : "false"}>
            <MoonDisc illumination={snapshot.illumination} waxing={snapshot.waxing} phase={snapshot.phase} />
            <figcaption className="moon-disc__caption">{today.phaseName} · освещено {percent} %</figcaption>
          </figure>
          <ul className="moon-tiles">
            <li className="moon-tile" data-kind="phase"><span className="moon-tile__label">Фаза</span><span className="moon-tile__value">{today.phaseName}</span><span className="moon-tile__note">{snapshot.waxing ? "растущая" : "убывающая"} · освещено {percent} %</span></li>
            <li className="moon-tile" data-kind="sign"><span className="moon-tile__label">Знак Луны</span><span className="moon-tile__value">{today.signName}</span><span className="moon-tile__note">{Math.floor(snapshot.signDegree)}° знака</span></li>
            <li className="moon-tile" data-kind="day"><span className="moon-tile__label">Лунные сутки</span><span className="moon-tile__value">{today.lunarDay.number}-е</span><span className="moon-tile__note">начались {today.lunarDay.startsLabel}, закончатся {today.lunarDay.endsLabel}</span></li>
            <li className="moon-tile" data-kind="rise"><span className="moon-tile__label">Восход и заход</span><span className="moon-tile__value">{today.rise ?? "—"} / {today.set ?? "—"}</span><span className="moon-tile__note">по Москве</span></li>
          </ul>
          <p className="moon-next">Ближайшая смена: {today.next.label}</p>
        </header>
        <MoonStrip days={today.strip} />
        {hasTexts && (
          <section className="moon-text" aria-labelledby="moon-text-title">
            <h2 id="moon-text-title">Что описывает этот день</h2>
            {today.texts.phase && <article className="moon-text__block" data-kind="phase"><h3>{today.texts.phase.title}</h3><p>{today.texts.phase.text}</p><p className="moon-text__question">{today.texts.phase.question}</p></article>}
            {today.texts.day && <article className="moon-text__block" data-kind="day"><h3>{today.texts.day.day}-е лунные сутки · {today.texts.day.symbol}</h3><p>{today.texts.day.text}</p><p className="moon-text__question">{today.texts.day.question}</p></article>}
            {today.signSummary && <article className="moon-text__block" data-kind="sign"><h3>Луна {today.signName}</h3><p>{today.signSummary.text}</p></article>}
          </section>
        )}
        <section className="moon-links" aria-labelledby="moon-links-title">
          <h2 id="moon-links-title">Продолжить</h2>
          <ul>
            <li><Link className="touch-link" href={today.links.cardOfDay}>Вытянуть карту дня</Link></li>
            <li><Link className="touch-link" href={today.links.natal}>Какая Луна в вашей натальной карте</Link></li>
            {today.signSummary && <li><Link className="touch-link" href={today.signSummary.href}>Значение: Луна {today.signName}</Link></li>}
          </ul>
        </section>
        <section className="moon-faq" aria-labelledby="moon-faq-title">
          <h2 id="moon-faq-title">Вопросы о Луне и лунных сутках</h2>
          {MOON_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </section>
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
