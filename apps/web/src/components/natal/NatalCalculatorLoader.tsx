import { NATAL_REPORT_PRODUCT, toIsoDate } from "@oracle/core";
import type { QuickVariant } from "@/lib/natal-quick-pages";
import type { SavedBirth } from "@/lib/natal-save";
import { getDb } from "@/server/db";
import { isOwnerUser } from "@/server/owner";
import { salesEnabled } from "@/server/payments-deps";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";
import { NatalCalculator } from "./NatalCalculator";

// Калькулятор с данными вошедшего (портрет, владелица, продажа): то же, что собирает страница /natalnaya-karta, для страниц быстрых расчётов
export async function NatalCalculatorLoader({ answer }: { answer?: QuickVariant }) {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const savedProfile: SavedBirth | null = portrait?.birthDate ? { date: toIsoDate(portrait.birthDate), time: portrait.time, place: portrait.place } : null;
  return <NatalCalculator signedIn={Boolean(user)} savedProfile={savedProfile} offerEnabled={salesEnabled(NATAL_REPORT_PRODUCT)} ownerFree={user ? await isOwnerUser(user.id) : false} answer={answer} />;
}
