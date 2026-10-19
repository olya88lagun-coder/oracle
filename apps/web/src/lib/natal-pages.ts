import { ACCEPTED_BATCHES, natalPageBySlug, NATAL_PAGES, natalText, SIGN_IDS, type NatalPageRef } from "@oracle/content/natal";
import type { SignId } from "@oracle/core/natal";

// Страницы значений, открытые для посетителей: только принятые партии, и только те, у которых есть текст.
// От этого списка зависят адреса страниц (generateStaticParams), карта сайта и ссылки; остальное — настоящий 404
export const acceptedNatalPages = (): NatalPageRef[] => NATAL_PAGES.filter((page) => ACCEPTED_BATCHES.has(page.batch) && natalText(page.slug) !== undefined);

export function acceptedNatalPage(slug: string): NatalPageRef | undefined {
  const page = natalPageBySlug(slug);
  return page && ACCEPTED_BATCHES.has(page.batch) && natalText(page.slug) !== undefined ? page : undefined;
}

// Предыдущий и следующий знак того же тела по кругу (после Рыб — снова Овен); ссылки нужны только на открытые страницы
export function neighborPages(page: NatalPageRef): { previous: NatalPageRef | undefined; next: NatalPageRef | undefined } {
  const index = SIGN_IDS.indexOf(page.sign);
  const sibling = (sign: SignId | undefined) => NATAL_PAGES.find((item) => item.body === page.body && item.sign === sign && acceptedNatalPage(item.slug));
  return { previous: sibling(SIGN_IDS[(index + SIGN_IDS.length - 1) % SIGN_IDS.length]), next: sibling(SIGN_IDS[(index + 1) % SIGN_IDS.length]) };
}

// Все знаки того же тела (только открытые страницы), в порядке зодиака
export const sameBodyPages = (page: NatalPageRef): NatalPageRef[] => NATAL_PAGES.filter((item) => item.body === page.body && acceptedNatalPage(item.slug));
