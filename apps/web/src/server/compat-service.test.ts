import { describe, expect, test, vi } from "vitest";
import { createCompatPdf } from "./compat-service";
import { pdfAssetsDir } from "./pdf-assets";

const NOW = new Date("2026-10-05T10:00:00Z");

describe("createCompatPdf", () => {
  test("returns a PDF for two valid dates", async () => {
    const result = await createCompatPdf({ a: "1988-11-18", b: "2000-01-01" }, NOW, pdfAssetsDir());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  test.each([
    [null],
    ["текст"],
    [{}],
    [{ a: "1988-11-18" }],
    [{ a: "1988-11-18", b: "не дата" }],
    [{ a: "1899-12-31", b: "2000-01-01" }],
    [{ a: "2999-01-01", b: "2000-01-01" }],
    [{ a: 19881118, b: "2000-01-01" }],
  ])("rejects %j without building anything", async (body) => {
    expect(await createCompatPdf(body, NOW, pdfAssetsDir())).toEqual({ ok: false, error: "invalid" });
  });

  test("does not write the dates to the log when it fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(createCompatPdf({ a: "1988-11-18", b: "2000-01-01" }, NOW, "/no/such/dir")).rejects.toThrow();
    expect(JSON.stringify([...error.mock.calls, ...warn.mock.calls])).not.toMatch(/1988|2000-01-01/);
    error.mockRestore();
    warn.mockRestore();
  });
});
