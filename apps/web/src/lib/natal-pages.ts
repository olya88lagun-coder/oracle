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

// Ось лунных узлов: южный узел всегда в противоположном знаке. Страница «Северный узел» в этом знаке читает ту же ось с другого конца
export const oppositeSign = (sign: SignId): SignId => SIGN_IDS[(SIGN_IDS.indexOf(sign) + SIGN_IDS.length / 2) % SIGN_IDS.length] ?? sign;

export function nodeAxisFor(page: NatalPageRef, isOpen: (candidate: NatalPageRef) => boolean = (candidate) => acceptedNatalPage(candidate.slug) !== undefined): { north: SignId; south: SignId; mirror: NatalPageRef | undefined } | null {
  if (page.body !== "northNode") return null;
  const south = oppositeSign(page.sign);
  const mirror = NATAL_PAGES.find((item) => item.body === "northNode" && item.sign === south);
  return { north: page.sign, south, mirror: mirror && isOpen(mirror) ? mirror : undefined };
}

// Все знаки того же тела (только открытые страницы), в порядке зодиака
export const sameBodyPages = (page: NatalPageRef): NatalPageRef[] => NATAL_PAGES.filter((item) => item.body === page.body && acceptedNatalPage(item.slug));
