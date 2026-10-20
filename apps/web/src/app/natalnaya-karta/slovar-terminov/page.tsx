import { NatalGlossary } from "@/components/natal/NatalGlossary";
import { DISCLAIMER, NATAL_TITLE } from "@/lib/natal-copy";
import { GLOSSARY_DESCRIPTION, GLOSSARY_LEAD, GLOSSARY_PATH, GLOSSARY_TITLE, glossaryJsonLd } from "@/lib/natal-glossary";
import { NATAL_PATH } from "@/lib/natal-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata = publicMetadata({ title: GLOSSARY_TITLE, description: GLOSSARY_DESCRIPTION, path: GLOSSARY_PATH });

export default function NatalGlossaryPage() {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: NATAL_TITLE, item: `${SITE_URL}${NATAL_PATH}` },
      { "@type": "ListItem", position: 2, name: "Словарь терминов", item: `${SITE_URL}${GLOSSARY_PATH}` },
    ],
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(glossaryJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <header className="natal-intro">
        <h1>{GLOSSARY_TITLE}</h1>
        <p>{GLOSSARY_LEAD}</p>
      </header>
      <NatalGlossary />
      <p className="natal-disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
