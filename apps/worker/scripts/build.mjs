import { build } from "esbuild";

// Воркер собирается в один ESM-файл: workspace-пакеты экспортируют .ts, а Node не резолвит их импорты без расширений.
// Тексты арканов (JSON) попадают в бандл, поэтому образу не нужны ни исходники, ни node_modules
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  outfile: "dist/main.mjs",
  external: ["pg-native"],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
});
