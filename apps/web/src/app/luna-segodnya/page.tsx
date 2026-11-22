import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MoonRibbon } from "@/components/moon/MoonRibbon";
import { moonRibbonData } from "@/lib/moon-ribbon";
import { MoonAlbum } from "@/components/moon/MoonAlbum";
import { MoonDayAsk } from "@/components/moon/MoonDayAsk";
import { MoonExplorer, type MoonView } from "@/components/moon/MoonExplorer";
import { MoonNatalBridge } from "@/components/moon/MoonNatalBridge";
import { PosterButton } from "@/components/PosterButton";
import { moonPosterSpec } from "@/lib/poster-moon";
import { WeekdayStrip } from "@/components/weekday/WeekdayStrip";
import { weekdayPlanet } from "@/lib/weekday-planets";
import type { MoonSnapshot } from "@oracle/core/moon";
import { DISCLAIMER } from "@/lib/legal";
import { currentMonth, currentMonthPath } from "@/lib/lunar-calendar-paths";
import { collectionItems } from "@/lib/moon-collection-items";
import { openedBy } from "@/lib/moon-collection";
import { buildThreadDays } from "@/lib/moon-thread";
import { lunarDayImage, phaseImage, signImage } from "@/lib/moon-images";
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

// Картинка карточки: гравюра, а когда её нет (гравюры суток ещё не готовы) — запасной вариант, обычно крупная цифра
function CardArt({ src, fallback }: { src: string | null; fallback?: string }) {
  return (
    <div className="moon-text__art">
      {src ? <Image src={src} alt="" width={480} height={480} unoptimized loading="lazy" sizes="(min-width: 900px) 320px, 100vw" /> : fallback && <span className="moon-text__numeral">{fallback}</span>}
    </div>
  );
}

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

function toMoonView(date: string, dateLabel: string, snapshot: MoonSnapshot): MoonView {
  const { illumination, waxing, phase } = snapshot;
  return { date, dateLabel, illumination, waxing, phase, phaseName: PHASE_NAMES[phase] };
}

export default function MoonTodayPage() {
  const now = new Date();
  const today = buildMoonToday(now);
  const { snapshot } = today;
  const percent = Math.round(snapshot.illumination * 100);
  const hasTexts = Boolean(today.texts.phase || today.texts.day);
  const question = today.texts.day?.question ?? today.texts.phase?.question;
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
        <MoonExplorer
          today={toMoonView(today.strip[0]!.date, today.dateLabel, snapshot)}
          days={today.strip.map(({ date, label, isToday, snapshot: daySnapshot }) => ({
            ...toMoonView(date, dayMonth.format(new Date(`${date}T12:00:00+03:00`)), daySnapshot),
            label,
            isToday,
          }))}
          ask={question ? <MoonDayAsk date={today.strip[0]!.date} question={question} /> : undefined}
          heading={<><h1>Луна сегодня, {today.dateLabel}</h1><p className="moon-hero__place">По Москве</p></>}
          todayDetails={<>
          <ul className="moon-tiles">
            <li className="moon-tile" data-kind="phase"><span className="moon-tile__label">Фаза</span><span className="moon-tile__value">{today.phaseName}</span><span className="moon-tile__note">{snapshot.waxing ? "растущая" : "убывающая"} · освещено {percent} %</span></li>
            <li className="moon-tile" data-kind="sign"><span className="moon-tile__label">Знак Луны</span><span className="moon-tile__value">{today.signName}</span><span className="moon-tile__note">{Math.floor(snapshot.signDegree)}° знака</span></li>
            <li className="moon-tile" data-kind="day"><span className="moon-tile__label">Лунные сутки</span><span className="moon-tile__value">{today.lunarDay.number}-е</span><span className="moon-tile__note">начались {today.lunarDay.startsLabel}, закончатся {today.lunarDay.endsLabel}</span></li>
            <li className="moon-tile" data-kind="rise"><span className="moon-tile__label">Восход и заход</span><span className="moon-tile__value">{today.rise ?? "—"} / {today.set ?? "—"}</span><span className="moon-tile__note">по Москве</span></li>
          </ul>
          <p className="moon-next">Ближайшая смена: {today.next.label}</p>
          <p className="moon-poster"><PosterButton spec={moonPosterSpec(today)} /></p>
          </>}
        />
        {hasTexts && (
          <section className="moon-text" aria-labelledby="moon-text-title">
            <h2 id="moon-text-title">Что описывает этот день</h2>
            {today.texts.phase && <article className="moon-text__block" data-kind="phase"><CardArt src={phaseImage(snapshot.phase, 480)} /><p className="moon-text__eyebrow">Фаза</p><h3>{today.texts.phase.title}</h3><p>{today.texts.phase.text}</p><p className="moon-text__question">{today.texts.phase.question}</p></article>}
            {today.texts.day && <article className="moon-text__block" data-kind="day"><CardArt src={lunarDayImage(today.texts.day.day, 480)} fallback={String(today.texts.day.day)} /><p className="moon-text__eyebrow">Лунные сутки</p><h3>{today.texts.day.day}-е лунные сутки · {today.texts.day.symbol}</h3><p>{today.texts.day.text}</p><p className="moon-text__question">{today.texts.day.question}</p></article>}
            {today.signSummary && <article className="moon-text__block" data-kind="sign"><CardArt src={signImage(snapshot.sign, 480)} /><p className="moon-text__eyebrow">Знак Луны</p><h3>Луна {today.signName}</h3><p>{today.signSummary.text}</p></article>}
          </section>
        )}
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
