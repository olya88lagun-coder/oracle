import Image from "next/image";
import Link from "next/link";
import { DISCLAIMER } from "@/lib/legal";
import { dayOrdinal } from "@/lib/day-ordinal";
import { dateAnswer, dateFaq, dateTitle } from "@/lib/lunar-day-copy";
import type { DatePage } from "@/lib/lunar-day-page";
import { lunarDayImage, phaseImage } from "@/lib/moon-images";
import { MOON_PATH } from "@/lib/moon-paths";
import { dayPath } from "@/lib/moon-year-paths";
import { MoonHub } from "./MoonHub";
import { MoonNatalBridge } from "./MoonNatalBridge";
import { MoonFaq } from "./MoonPageParts";
import { MoonRibbon } from "./MoonRibbon";

// Страница одной даты лунного календаря. Серверная: всё считается заранее по Москве, расчёт Луны в браузер не попадает.
// Первый экран: диск фазы, заголовок и сразу ответ на запрос «Луна <дата>»; ниже события дня, плитки с числами, соседние дни и тексты суток и фазы
export function MoonDatePage({ page, now }: { page: DatePage; now: Date }) {
  const title = dateTitle(page);
  const percent = Math.round(page.illumination * 100);
  const art = phaseImage(page.phase, 480);
  const dayArt = page.lunarNumber ? lunarDayImage(page.lunarNumber, 480) : null;
  const quiet = !page.mainEvent && !page.signChange;
  const ordinal = dayOrdinal(page.lunarNumber);
  return (
    <main className="moon-month moon-date">
      <MoonRibbon current="calendar" now={now} />
      <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={MOON_PATH}>Луна сегодня</Link><span aria-hidden="true">/</span><Link href={page.monthHref}>{page.monthLabel}</Link><span aria-hidden="true">/</span><span>{page.day} {page.dateLabel.split(" ")[1]}</span></nav>

      <header className="moon-month__head moon-month__head--compact moon-day-head moon-date__head">
        {art && (
          <div className="moon-day-head__art">
            <Image src={art} alt={`Луна ${page.dateLabel}: ${page.phaseName}, освещено ${percent} %`} width={480} height={480} unoptimized priority sizes="(min-width: 700px) 220px, 180px" />
          </div>
        )}
        <div className="moon-day-head__text">
          <h1>{title}</h1>
          <p className="moon-hero__place">По Москве · {page.weekday}</p>
        </div>
      </header>

      <p className="moon-date__answer">{dateAnswer(page)}</p>

      <ul className="moon-tiles moon-date__tiles">
        <li className="moon-tile" data-kind="phase"><span className="moon-tile__label">Фаза</span><span className="moon-tile__value">{page.phaseName}</span><span className="moon-tile__note">{page.waxing ? "растущая" : "убывающая"} · освещено {percent} %</span></li>
        <li className="moon-tile" data-kind="sign"><span className="moon-tile__label">Знак Луны</span><span className="moon-tile__value">{page.signName}</span><span className="moon-tile__note">{page.signChange ? `в ${page.signChange.time} — ${page.signChange.signName}` : `${page.signDegree}° знака`}</span></li>
        <li className="moon-tile" data-kind="day"><span className="moon-tile__label">Лунные сутки</span><span className="moon-tile__value">{ordinal}</span><span className="moon-tile__note">{page.lunarChange ? `в ${page.lunarChange.time} начнутся ${dayOrdinal(page.lunarChange.to)}` : "весь день"}</span></li>
        <li className="moon-tile" data-kind="rise"><span className="moon-tile__label">Восход и заход</span><span className="moon-tile__value">{page.rise ?? "—"} / {page.set ?? "—"}</span><span className="moon-tile__note">по Москве</span></li>
      </ul>

      <section className="moon-date__section" aria-labelledby="moon-date-events-title">
        <h2 id="moon-date-events-title">{page.events.length > 1 ? "События дня" : "Событие дня"}</h2>
        {quiet && <p className="moon-date__quiet">Главных фаз и входа Луны в новый знак в этот день нет.</p>}
        {page.events.length > 0 && (
          <ol className="moon-date-events">
            {page.events.map((event) => (
              <li key={`${event.kind}-${event.at}`} className={`moon-date-event moon-date-event--${event.kind}`}>
                <time>{event.time}</time>
                <div>
                  <strong>{event.text}</strong>
                  {event.note && <p>{event.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="moon-date__section" aria-labelledby="moon-date-days-title">
        <h2 id="moon-date-days-title">Соседние дни</h2>
        <ol className="moon-date-days">
          {page.neighbours.map((item) => (
            <li key={item.href} className="moon-date-days__item">
              <Link href={item.href} aria-current={item.current ? "date" : undefined} aria-label={`${item.label}: ${item.phaseName}`}>
                {item.image && <Image src={item.image} alt="" width={160} height={160} unoptimized loading="lazy" />}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ol>
        <nav className="moon-links moon-links--pager" aria-label="Вчера, завтра и месяц">
          <ul>
            {page.prev && <li><Link href={page.prev.href} rel="prev">← {page.prev.label}</Link></li>}
            {page.next && <li><Link href={page.next.href} rel="next">{page.next.label} →</Link></li>}
            <li><Link href={page.monthHref}>Календарь: {page.monthLabel.toLowerCase()}</Link></li>
          </ul>
        </nav>
      </section>

      {(page.texts.day || page.texts.phase) && (
        <section className="moon-text" aria-labelledby="moon-date-text-title">
          <h2 id="moon-date-text-title">Что описывает этот день</h2>
          {page.texts.day && (
            <article className="moon-text__block" data-kind="day">
              {dayArt && <div className="moon-text__art"><Image src={dayArt} alt="" width={480} height={480} unoptimized loading="lazy" sizes="(min-width: 900px) 320px, 100vw" /></div>}
              <p className="moon-text__eyebrow">Лунные сутки</p>
              <h3>{ordinal} лунные сутки · {page.texts.day.symbol}</h3>
              <p>{page.texts.day.text}</p>
              <p className="moon-text__question">{page.texts.day.question}</p>
              <p><Link href={dayPath(page.lunarNumber)}>Подробнее: {ordinal} лунные сутки →</Link></p>
            </article>
          )}
          {page.texts.phase && (
            <article className="moon-text__block" data-kind="phase">
              {art && <div className="moon-text__art"><Image src={art} alt="" width={480} height={480} unoptimized loading="lazy" sizes="(min-width: 900px) 320px, 100vw" /></div>}
              <p className="moon-text__eyebrow">Фаза</p>
              <h3>{page.texts.phase.title}</h3>
              <p>{page.texts.phase.text}</p>
              <p className="moon-text__question">{page.texts.phase.question}</p>
            </article>
          )}
        </section>
      )}

      <MoonNatalBridge from="day" signName={page.signLine.replace(/^Луна /, "")} />
      <MoonFaq id="moon-date-faq-title" title={`Вопросы о Луне ${page.dateLabel}`} items={dateFaq(page)} />
      <MoonHub now={now} current={page.monthHref} id="moon-date-links-title" />
      <p className="moon-disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
