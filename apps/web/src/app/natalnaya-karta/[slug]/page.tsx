import { BODY_NAMES, natalHouseText, natalText, SIGN_NAMES } from "@oracle/content/natal";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NatalPageView } from "@/components/natal/NatalPageView";
import { meaningCoverAlt, meaningTitle, NATAL_TITLE } from "@/lib/natal-copy";
import { acceptedHousePage, acceptedHousePages, acceptedNatalPage, acceptedNatalPages, natalDescription } from "@/lib/natal-pages";
import { natalCoverPath, NATAL_COVER_SIZE } from "@/lib/natal-covers";
import { NATAL_PATH, natalPagePath } from "@/lib/natal-paths";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

// Открыты только страницы принятых партий; остальные адреса — настоящий 404.
// Тот же адрес обслуживает страницы «планета в доме» («venera-v-7-dome»): у них своя партия в том же ACCEPTED_BATCHES
export const dynamicParams = false;

export function generateStaticParams() {
  return [...acceptedNatalPages(), ...acceptedHousePages()].map((page) => ({ slug: page.slug }));
}

function openPage(slug: string) {
  const sign = acceptedNatalPage(slug);
  const signText = sign && natalText(sign.slug);
  if (sign && signText) return { page: sign, text: signText, about: `${BODY_NAMES[sign.body].name}, ${SIGN_NAMES[sign.sign].nominative}` };
  const house = acceptedHousePage(slug);
  const houseText = house && natalHouseText(house.slug);
  if (house && houseText) return { page: house, text: houseText, about: `${BODY_NAMES[house.body].name}, ${house.house} дом` };
  return undefined;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const open = openPage((await params).slug);
  if (!open) return {};
  const { page, text } = open;
  const cover = natalCoverPath(page.slug);
  return publicMetadata({
    title: meaningTitle(text.name),
    description: natalDescription(text),
    path: natalPagePath(page),
    image: cover ? { url: cover, alt: meaningCoverAlt(text.name), width: NATAL_COVER_SIZE, height: NATAL_COVER_SIZE } : SITE_PREVIEW_IMAGE,
  });
}

export default async function NatalMeaningPage({ params }: Params) {
  const open = openPage((await params).slug);
  if (!open) notFound();
  const { page, text, about } = open;
  const url = `${SITE_URL}${natalPagePath(page)}`;
  const cover = natalCoverPath(page.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: meaningTitle(text.name),
        description: natalDescription(text),
        inLanguage: "ru",
        keywords: text.keywords.join(", "),
        mainEntityOfPage: url,
        ...(cover && { image: `${SITE_URL}${cover}` }),
        about,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: NATAL_TITLE, item: `${SITE_URL}${NATAL_PATH}` },
          { "@type": "ListItem", position: 2, name: text.name, item: url },
        ],
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <NatalPageView page={page} text={text} />
    </>
  );
}
