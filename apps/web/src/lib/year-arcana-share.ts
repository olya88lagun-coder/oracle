import { yearShareContent } from "./year-arcana";

type ShareBrowser = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  clipboard?: { writeText: (text: string) => Promise<void> };
};
export type YearShareOutcome = "shared" | "copied" | "cancelled" | "fallback";

export async function shareYearCard(arcanum: { number: number; name: string }, siteUrl: string, file: File | null, browser: ShareBrowser): Promise<YearShareOutcome> {
  const content = yearShareContent(arcanum, siteUrl);
  try {
    if (browser.share) {
      const withFile = file && browser.canShare?.({ files: [file] });
      await browser.share({ ...content, ...(withFile ? { files: [file] } : {}) });
      return "shared";
    }
    if (!browser.clipboard) return "fallback";
    await browser.clipboard.writeText(`${content.text}\n${content.url}`);
    return "copied";
  } catch (error) {
    return error instanceof Error && error.name === "AbortError" ? "cancelled" : "fallback";
  }
}
