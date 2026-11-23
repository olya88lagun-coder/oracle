// Глифы натальной карты для PDF: pdfkit рисует векторные пути, а не <use>, поэтому элементы символов из NatalSprite.tsx
// переписываются в apps/web/src/server/natal-glyph-data.ts. Запуск после правки спрайта: node scripts/natal-glyph-data.mjs
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("apps/web/src/components/natal/NatalSprite.tsx", "utf8");
const glyphs = {};
for (const [, id, body] of source.matchAll(/<symbol id="(glyph-[a-z]+)"[^>]*>(.*?)<\/symbol>/g)) {
  glyphs[id] = [...body.matchAll(/<(circle|path)\b([^>]*)\/>/g)].map(([, kind, attrs]) => {
    const get = (name) => attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
    return kind === "path" ? { d: get("d") } : { cx: Number(get("cx")), cy: Number(get("cy")), r: Number(get("r")), fill: get("fill") === "currentColor" };
  });
}
const lines = Object.entries(glyphs).map(([id, shapes]) => `  "${id}": ${JSON.stringify(shapes)},`);
writeFileSync(
  "apps/web/src/server/natal-glyph-data.ts",
  `// Создан скриптом scripts/natal-glyph-data.mjs из components/natal/NatalSprite.tsx, не править вручную. Сетка символа 24×24, линия 1.6, закруглённые концы\nexport type GlyphShape = { d: string } | { cx: number; cy: number; r: number; fill: boolean };\nexport const GLYPH_STROKE = 1.6;\nexport const GLYPHS: Readonly<Record<string, readonly GlyphShape[]>> = {\n${lines.join("\n")}\n};\n`,
);
console.log(Object.keys(glyphs).length, "glyphs");
