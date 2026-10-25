import { expect, test, vi } from "vitest";
import { shareYearCard } from "./year-arcana-share";

const arcanum = { number: 5, name: "Иерофант" };
const file = new File(["png"], "card.png", { type: "image/png" });

test("native file sharing uses the prepared PNG and a safe campaign link", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  expect(await shareYearCard(arcanum, "https://oracle.test", file, { share, canShare: () => true })).toBe("shared");
  expect(share.mock.calls[0]?.[0]).toMatchObject({ files: [file], url: expect.stringContaining("utm_campaign=new_year_2027") });
});
test("unsupported file sharing falls back to native text sharing", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  expect(await shareYearCard(arcanum, "https://oracle.test", file, { share, canShare: () => false })).toBe("shared");
  expect(share.mock.calls[0]?.[0]).not.toHaveProperty("files");
});
test("native cancellation is distinct from success", async () => {
  const share = vi.fn().mockRejectedValue(new DOMException("closed", "AbortError"));
  expect(await shareYearCard(arcanum, "https://oracle.test", file, { share })).toBe("cancelled");
});
test("without native sharing, copies text and URL; denied clipboard returns a manual fallback", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  expect(await shareYearCard(arcanum, "https://oracle.test", null, { clipboard: { writeText } })).toBe("copied");
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Мой аркан 2027 года — 5"));
  expect(await shareYearCard(arcanum, "https://oracle.test", null, {})).toBe("fallback");
  expect(await shareYearCard(arcanum, "https://oracle.test", null, { clipboard: { writeText: async () => { throw new Error("denied"); } } })).toBe("fallback");
});
