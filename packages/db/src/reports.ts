import type { ChapterId, ScenarioField } from "@oracle/core";
import type { NatalChapterId } from "@oracle/core/natal";
import { eq } from "drizzle-orm";
import { reports } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

// Глава хранится вместе с пометкой, кто её написал: ИИ или сборка из блоков без ИИ
export type StoredChapter = {
  id: ChapterId;
  source: "ai" | "fallback";
  paragraphs?: string[];
  scenario?: Record<ScenarioField, string>;
};
export type StoredReport = { chapters: StoredChapter[]; createdAt: Date };
// Глава натального разбора: те же поля, но свои идентификаторы глав
export type StoredNatalChapter = Omit<StoredChapter, "id"> & { id: NatalChapterId };
export type StoredNatalReport = { chapters: StoredNatalChapter[]; createdAt: Date };

// Воркер может взять одну задачу дважды: сохранится только первый разбор
export async function saveReport(db: Database, p: { purchaseId: string; chapters: readonly (StoredChapter | StoredNatalChapter)[] }): Promise<{ created: boolean }> {
  const inserted = await db
    .insert(reports)
    .values({ purchaseId: p.purchaseId, chapters: p.chapters })
    .onConflictDoNothing({ target: reports.purchaseId })
    .returning({ id: reports.id });
  return { created: inserted.length > 0 };
}

export async function getReport(db: Database, purchaseId: string): Promise<StoredReport | null> {
  if (!isUuid(purchaseId)) return null;
  const [row] = await db.select().from(reports).where(eq(reports.purchaseId, purchaseId)).limit(1);
  return row ? { chapters: row.chapters as StoredChapter[], createdAt: row.createdAt } : null;
}

// Разбор натальной карты: хранится в той же таблице, главы читаются со своим типом
export async function getNatalReport(db: Database, purchaseId: string): Promise<StoredNatalReport | null> {
  const report = await getReport(db, purchaseId);
  return report ? { chapters: report.chapters as unknown as StoredNatalChapter[], createdAt: report.createdAt } : null;
}
