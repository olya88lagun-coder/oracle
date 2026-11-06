import { ARCANA } from "@oracle/content";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { arcanumParam } from "@/lib/arcana-paths";
import Page, { generateMetadata } from "./page";

const params = (arkan: string) => ({ params: Promise.resolve({ arkan }) });

describe("/matrica-sudby/[arkan]", () => {
  test("every description names the number the way people search for it and fits 160 chars", async () => {
    for (const arcanum of ARCANA) {
      const description = String((await generateMetadata(params(arcanumParam(arcanum)))).description);
      expect(description, arcanum.slug).toMatch(new RegExp(`^Число ${arcanum.number} в матрице судьбы — аркан `));
      expect(description.length, arcanum.slug).toBeLessThanOrEqual(160);
    }
  });

  test("the page answers «what does number N mean» and publishes the same questions as FAQPage", async () => {
    const html = renderToStaticMarkup(await Page(params("arkan-6-vlyublennye")));
    expect(html).toContain("Число 6 в матрице судьбы — это аркан Влюблённые");
    const questions = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((match) => match[1]);
    expect(questions).toEqual(["Что значит число 6 в матрице судьбы?", "Что значит 6 в личности?", "Что значит 6 в центре матрицы?"]);
    const faq = JSON.parse([...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => match[1]!).find((json) => json.includes("FAQPage"))!);
    expect(faq.mainEntity.map((item: { name: string }) => item.name)).toEqual(questions);
  });
});
