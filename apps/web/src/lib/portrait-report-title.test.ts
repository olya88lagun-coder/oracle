import { expect, test } from "vitest";
import { PORTRAIT_REPORT_TITLE } from "./natal-copy";
import { portraitReportTitle } from "./portrait-report-title";
import { THREAD_REPORT_TITLE } from "./thread-copy";

test("the portrait list names each paid product by its own title", () => {
  expect(portraitReportTitle("natal_report")).toBe(PORTRAIT_REPORT_TITLE);
  expect(portraitReportTitle("thread_report")).toBe(THREAD_REPORT_TITLE);
  expect(portraitReportTitle("matrix_report")).toBe("Разбор матрицы судьбы");
});
