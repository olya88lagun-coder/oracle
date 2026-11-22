import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MoonRibbon } from "@/components/moon/MoonRibbon";
import { MoonHub } from "@/components/moon/MoonHub";
import { MoonFaq, MoonHead, moonJsonLd } from "@/components/moon/MoonPageParts";
import { DISCLAIMER } from "@/lib/legal";
import { buildDaysHub } from "@/lib/moon-events";
import { lunarDayImage } from "@/lib/moon-images";
import { DAYS_PATH } from "@/lib/moon-year-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";

const TITLE = "Лунные сутки: все 30";

export const metadata: Metadata = publicMetadata({
  title: TITLE,
  description: "Все 30 лунных суток: символ, образ, вопрос к себе и ближайшие даты по Москве. Первые сутки начинаются в новолуние, следующие — с восхода Луны. Бесплатно.",
  path: DAYS_PATH,
});

// Каталог от времени не зависит: пересчёт раз в сутки нужен только блоку «Продолжить» (ссылки на текущий месяц и год)
export const revalidate = 86400;

export default function LunarDaysPage() {
  const hub = buildDaysHub();
  const now = new Date();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(moonJsonLd(TITLE, DAYS_PATH, hub.faq)) }} />
      <main className="moon-month">
        <MoonRibbon current="days" now={now} />
        <MoonHead title={TITLE} intro={hub.intro} />
        <section className="moon-day-cards" aria-labelledby="moon-days-list-title">
          <h2 id="moon-days-list-title">Сутки по номерам</h2>
          <ol className="moon-day-cards__grid">
            {hub.items.map((item) => {
              const art = lunarDayImage(item.day, 480);
              return (
                <li key={item.day}>
                  <Link className="moon-day-card" href={item.href}>
                    {art && <Image src={art} alt="" width={480} height={480} unoptimized loading="lazy" sizes="(min-width: 860px) 190px, (min-width: 560px) 30vw, 46vw" />}
                    <span className="moon-day-card__label">{item.day} · {item.symbol}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
        <MoonFaq id="moon-days-faq-title" title="Вопросы о лунных сутках" items={hub.faq} />
        <MoonHub now={now} current={DAYS_PATH} id="moon-days-links-title" />
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
