import { arcanumPath } from "./arcana-paths";

export type SaveStatus = "idle" | "saving" | "error";
export type SaveBlockState = "guest" | "offer" | "saving" | "saved" | "error";

export const DATE_ERROR = "Проверьте дату: она должна быть настоящей и не позже сегодняшней.";

export function saveBlockState(p: { signedIn: boolean; profileDate: string | null; date: string; status: SaveStatus }): SaveBlockState {
  if (p.status === "saving") return "saving";
  if (p.status === "error") return "error";
  if (!p.signedIn) return "guest";
  return p.profileDate === p.date ? "saved" : "offer";
}

// «Войти и сохранить»: намерение переживает переход в VK ID и обратно в той же вкладке
export const SAVE_INTENT_KEY = "oracle-save-after-login";
export type IntentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function sessionStore(): IntentStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function markSaveIntent(storage: IntentStorage | null): void {
  try {
    storage?.setItem(SAVE_INTENT_KEY, "1");
  } catch {
    // без хранилища человек просто нажмёт «Сохранить в портрет» после входа
  }
}

export function takeSaveIntent(storage: IntentStorage | null): boolean {
  try {
    const marked = storage?.getItem(SAVE_INTENT_KEY) === "1";
    storage?.removeItem(SAVE_INTENT_KEY);
    return marked;
  } catch {
    return false;
  }
}

// Делимся страницей аркана центра — дата рождения в ссылку не попадает
export function shareContent(arcanum: { number: number; name: string; slug: string }, siteUrl: string): { title: string; text: string; url: string } {
  const text = `Мой центр в матрице судьбы — аркан ${arcanum.number}, «${arcanum.name}»`;
  return { title: text, text, url: `${siteUrl}${arcanumPath(arcanum)}` };
}
