import type { Metadata } from "next";
import Link from "next/link";
import { MoonRibbon } from "@/components/moon/MoonRibbon";
import { moonRibbonData } from "@/lib/moon-ribbon";
import { MoonAlbum } from "@/components/moon/MoonAlbum";
import { MoonTodayView } from "@/components/moon/MoonTodayView";
import { MoonNatalBridge } from "@/components/moon/MoonNatalBridge";
import { WeekdayStrip } from "@/components/weekday/WeekdayStrip";
import { weekdayPlanet } from "@/lib/weekday-planets";
import { DISCLAIMER } from "@/lib/legal";
import { currentMonth, currentMonthPath } from "@/lib/lunar-calendar-paths";
import { collectionItems } from "@/lib/moon-collection-items";
import { openedBy } from "@/lib/moon-collection";
import { buildThreadDays } from "@/lib/moon-thread";
import { phaseImage, signImage } from "@/lib/moon-images";
import { buildMoonToday, MOON_FAQ, MOON_PATH, PHASE_NAMES } from "@/lib/moon-today";
import { PHASES_PATH, yearMoonPath } from "@/lib/moon-year-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Страница зависит от момента запроса: с ISR первый посетитель после просрочки получил бы вчерашнюю Луну. Расчёт занимает миллисекунды
export const dynamic = "force-dynamic";

// Дата в заголовке — запрос «луна сегодня 21 ноября»; картинка превью — гравюра сегодняшней фазы. Длина с суффиксом сайта ≤ 60 знаков (самый длинный месяц — «сентября»)
export function generateMetadata(): Metadata {
  const now = new Date();
  const phase = buildMoonToday(now).snapshot.phase;
  const art = phaseImage(phase);
  return publicMetadata({
    title: `Луна сегодня, ${dayMonth.format(now)}: фаза, знак, сутки`,
    description: "Какая сегодня Луна: фаза и освещённость, знак зодиака, лунные сутки, восход и заход по Москве и фазы на 14 дней вперёд. Бесплатно, без регистрации.",
    path: MOON_PATH,
    ...(art && { image: { url: art, alt: `Луна сегодня: ${PHASE_NAMES[phase]}` } }),
  });
}

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

export default function MoonTodayPage() {
  const now = new Date();
  const today = buildMoonToday(now);
  const { snapshot } = today;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      // Данные пересчитаны под сегодняшние сутки по Москве
      { "@type": "WebPage", name: `Луна сегодня, ${today.dateLabel}`, url: `${SITE_URL}${MOON_PATH}`, inLanguage: "ru", dateModified: `${today.strip[0]!.date}T00:00:00+03:00` },
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
        <MoonRibbon current="today" now={now} initial={moonRibbonData(now)} />
        <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Луна сегодня</span></nav>
        <MoonTodayView today={today} headingDate={today.dateLabel} />
        <MoonAlbum thread={buildThreadDays(now)} days={today.strip.map(({ date, snapshot: day }) => ({ date, sign: day.sign, phase: day.phase }))} items={collectionItems()} todayUnlock={openedBy(snapshot.sign, snapshot.phase)} />
        <MoonNatalBridge from="today" signName={today.signName} art={signImage(snapshot.sign, 160)} />
        <div className="weekday-today">
          <WeekdayStrip planet={weekdayPlanet(new Date())} />
        </div>
        <section className="moon-links" aria-labelledby="moon-links-title">
          <h2 id="moon-links-title">Продолжить</h2>
          <ul>
            <li><Link className="touch-link" href={currentMonthPath(new Date())}>Лунный календарь на месяц</Link></li>
            <li><Link className="touch-link" href={PHASES_PATH}>Фазы Луны</Link></li>
            <li><Link className="touch-link" href={yearMoonPath("new", currentMonth(new Date()).year)}>Новолуния года</Link></li>
            <li><Link className="touch-link" href={yearMoonPath("full", currentMonth(new Date()).year)}>Полнолуния года</Link></li>
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
