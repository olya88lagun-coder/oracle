import { NatalQuickPage } from "@/components/natal/NatalQuickPage";
import { QUICK_PAGES } from "@/lib/natal-quick-pages";
import { publicMetadata } from "@/lib/seo";

const page = QUICK_PAGES.moon;

export const metadata = publicMetadata({ title: page.metaTitle, description: page.description, path: page.path });

// Страница зависит от входа (форма заполняется данными из портрета), поэтому строится на запрос, как /natalnaya-karta
export default function Page() {
  return <NatalQuickPage variant="moon" />;
}
