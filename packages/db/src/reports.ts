import type { ChapterId, ScenarioField } from "@oracle/core";
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

// Воркер может взять одну задачу дважды: сохранится только первый разбор
export async function saveReport(db: Database, p: { purchaseId: string; chapters: readonly StoredChapter[] }): Promise<{ created: boolean }> {
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
