import { and, eq, isNull } from "drizzle-orm";
import { authIdentities, birthProfiles, users } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

// Пользователь не удаляется, а помечается: в плане 2 на него будут ссылаться покупки для налогового учёта.
// Способы входа удаляются — тот же аккаунт VK сможет зарегистрироваться заново как новый пользователь
export async function deleteUserData(db: Database, userId: string): Promise<{ deleted: boolean }> {
  if (!isUuid(userId)) return { deleted: false };
  return db.transaction(async (tx) => {
    const [marked] = await tx
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!marked) return { deleted: false };
    await tx.delete(birthProfiles).where(eq(birthProfiles.userId, userId));
    await tx.delete(authIdentities).where(eq(authIdentities.userId, userId));
    return { deleted: true };
  });
}
