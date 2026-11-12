import { SITE_URL } from "@/lib/site";
import sitemap from "../../sitemap";

// Те же адреса, что в /sitemap.xml, разложенные по разделам: /sitemaps/lila.xml и т. д. Их добавляют в Search Console и Вебмастер отдельно,
// чтобы видеть долю проиндексированных страниц по каждому разделу. Общий /sitemap.xml остаётся: на него опираются robots.txt, выкладка и IndexNow
const SITEMAP_SECTIONS: Readonly<Record<string, readonly string[]>> = {
  matrica: ["/matrica-sudby", "/arkan-2027", "/arkan-na-god"],
  sovmestimost: ["/sovmestimost"],
  lila: ["/lila"],
  taro: ["/taro"],
  natal: ["/natalnaya-karta"],
  numerologiya: ["/numerologiya"],
  blog: ["/blog"],
};
const OTHER = "obshchee";

const pathOf = (url: string): string => url.slice(SITE_URL.length) || "/";
const inPrefix = (path: string, prefix: string): boolean => path === prefix || path.startsWith(`${prefix}/`);

function sectionOf(path: string): string {
  return Object.entries(SITEMAP_SECTIONS).find(([, prefixes]) => prefixes.some((prefix) => inPrefix(path, prefix)))?.[0] ?? OTHER;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...Object.keys(SITEMAP_SECTIONS), OTHER].map((section) => ({ section: `${section}.xml` }));
}

const escapeXml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(_request: Request, { params }: { params: Promise<{ section: string }> }) {
  const section = (await params).section.replace(/\.xml$/, "");
  const entries = sitemap().filter((entry) => sectionOf(pathOf(entry.url)) === section);
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : "";
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}<changefreq>${entry.changeFrequency}</changefreq><priority>${entry.priority}</priority></url>`;
    })
    .join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
