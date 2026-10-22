import { NatalQuickPage } from "@/components/natal/NatalQuickPage";
import { QUICK_PAGES } from "@/lib/natal-quick-pages";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";

const page = QUICK_PAGES.ascendant;

export const metadata = publicMetadata({ title: page.metaTitle, description: page.description, path: page.path, image: SITE_PREVIEW_IMAGE });

// Страница зависит от входа (форма заполняется данными из портрета), поэтому строится на запрос, как /natalnaya-karta
export default function Page() {
  return <NatalQuickPage variant="ascendant" />;
}
