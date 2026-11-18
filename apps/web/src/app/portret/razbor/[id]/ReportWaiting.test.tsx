import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { THREAD_PATH } from "@/lib/life-thread";
import { THREAD_BACK_LABEL, THREAD_WAITING_BODY } from "@/lib/thread-copy";
import { ReportWaiting } from "./ReportWaiting";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("ReportWaiting", () => {
  test("the natal report gets its own modifier, the matrix report does not", () => {
    const natal = renderToStaticMarkup(<ReportWaiting purchaseId="p" initial="generating" product="natal_report" />);
    const matrix = renderToStaticMarkup(<ReportWaiting purchaseId="p" initial="generating" center={{ number: 9, image: "/x.webp" }} />);
    expect(natal).toContain("report-waiting report-waiting--natal");
    expect(matrix).not.toContain("report-waiting--natal");
    expect(matrix).toContain('class="card stack report-waiting"');
  });

  test("keeps the status text for every state of the natal report", () => {
    expect(renderToStaticMarkup(<ReportWaiting purchaseId="p" initial="pending" product="natal_report" />)).toContain("Ждём подтверждения оплаты");
    expect(renderToStaticMarkup(<ReportWaiting purchaseId="p" initial="canceled" product="natal_report" />)).toContain("Оплата не прошла");
  });

  test("the thread report shows its own copy and a link back to the thread", () => {
    const html = renderToStaticMarkup(<ReportWaiting purchaseId="p" initial="generating" product="thread_report" />);
    expect(html).toContain("Разбор нити");
    expect(html).toContain(THREAD_WAITING_BODY);
    expect(html).not.toContain("report-waiting--natal");
    const canceled = renderToStaticMarkup(<ReportWaiting purchaseId="p" initial="canceled" product="thread_report" />);
    expect(canceled).toContain(`href="${THREAD_PATH}"`);
    expect(canceled).toContain(THREAD_BACK_LABEL);
  });
});
