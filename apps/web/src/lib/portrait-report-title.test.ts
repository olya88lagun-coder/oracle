import { expect, test } from "vitest";
import { PORTRAIT_REPORT_TITLE } from "./natal-copy";
import { portraitReportTitle } from "./portrait-report-title";
import { THREAD_REPORT_TITLE } from "./thread-copy";

test("the portrait list names each paid product by its own title", () => {
  expect(portraitReportTitle("natal_report")).toBe(PORTRAIT_REPORT_TITLE);
  expect(portraitReportTitle("thread_report")).toBe(THREAD_REPORT_TITLE);
  expect(portraitReportTitle("matrix_report")).toBe("Разбор матрицы судьбы");
});

test("the report page tab is named after the bought product and stays out of search", async () => {
  const { reportPageMetadata } = await import("./portrait-report-title");
  expect(reportPageMetadata("thread_report").title).toBe("Разбор нити");
  expect(reportPageMetadata("natal_report").title).toBe(portraitReportTitle("natal_report"));
  expect(reportPageMetadata("matrix_report").title).toBe("Разбор матрицы судьбы");
  expect(reportPageMetadata(undefined).title).toBe("Разбор матрицы судьбы");
  expect(reportPageMetadata("thread_report").robots).toEqual({ index: false, follow: false });
});
