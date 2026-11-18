import type { Product } from "@oracle/core";
import { PORTRAIT_REPORT_TITLE } from "./natal-copy";
import { THREAD_REPORT_TITLE } from "./thread-copy";

// Название разбора в списке «Моего портрета»: у каждого платного продукта своё, иначе покупатель ищет «не то»
export function portraitReportTitle(product: Product): string {
  if (product === "natal_report") return PORTRAIT_REPORT_TITLE;
  if (product === "thread_report") return THREAD_REPORT_TITLE;
  return "Разбор матрицы судьбы";
}
