import { hasIdentity, type UserRecord } from "@oracle/db";
import { notFound } from "next/navigation";
import { getDb } from "./db";
import { getEnv } from "./env";
import { currentUser } from "./viewer";

// Владелица — аккаунт с VK ID из OWNER_VK_ID. Для неё платное бесплатно, а служебные страницы открываются только ей
export async function isOwnerUser(userId: string): Promise<boolean> {
  const ownerVkId = getEnv().ownerVkId;
  return ownerVkId !== null && (await hasIdentity(getDb(), userId, { provider: "vk", externalId: ownerVkId }));
}

// Остальным — обычная 404, без намёка, что страница есть
export async function requireOwner(): Promise<UserRecord> {
  const user = await currentUser();
  if (!user || !(await isOwnerUser(user.id))) notFound();
  return user;
}
