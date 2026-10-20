import { NatalSprite } from "@/components/natal/NatalSprite";
import { DISCLAIMER, NATAL_TITLE } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";
import { QUICK_PAGES, quickFaqJsonLd, type QuickVariant } from "@/lib/natal-quick-pages";
import { jsonLdScript } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { NatalCalculatorLoader } from "./NatalCalculatorLoader";
import { NatalQuickGuide } from "./NatalQuickGuide";

// Страница быстрого расчёта целиком: заголовок, калькулятор с ответом над картой, текст, вопросы и разметка FAQPage и хлебных крошек
export function NatalQuickPage({ variant }: { variant: QuickVariant }) {
  const page = QUICK_PAGES[variant];
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: NATAL_TITLE, item: `${SITE_URL}${NATAL_PATH}` },
      { "@type": "ListItem", position: 2, name: page.breadcrumb, item: `${SITE_URL}${page.path}` },
    ],
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(quickFaqJsonLd(variant)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <header className="natal-intro">
        <p className="natal-intro__eyebrow">{page.eyebrow}</p>
        <h1>{page.h1}</h1>
        <p>{page.lead}</p>
      </header>
      <NatalSprite />
      <NatalCalculatorLoader answer={variant} />
      <NatalQuickGuide variant={variant} />
      <p className="natal-disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
