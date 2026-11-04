import path from "node:path";
import type { NextConfig } from "next";

// `next build` запускается из apps/web (pnpm --filter), корень монорепо — на два уровня выше
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: ["@oracle/core", "@oracle/content", "@oracle/db", "@oracle/ai", "@oracle/geo"],
  // pdfkit читает свои шрифтовые данные с диска, поэтому его нельзя собирать в бандл
  serverExternalPackages: ["pdfkit"],
  poweredByHeader: false,
  // Значок разработки в углу перекрывал текст на локальных просмотрах; ошибки сборки Next.js показывает и без него
  devIndicators: false,
  // SEO: статья от 09.10 повторяла материал от 07.10 — сохраняем старые входящие ссылки.
  async redirects() {
    return [
      { source: "/blog/pole-igry-lila", destination: "/blog/kletki-lily-znachenie", statusCode: 301 },
    ];
  },
  // Базовые заголовки безопасности. CSP не включаем: Метрика подгружает свои скрипты
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      // Картинки из public отдавались с max-age=0 и перезапрашивались на каждом визите. Имена у них без хеша,
      // поэтому не immutable, а сутки: замена файла дойдёт до посетителей за день
      {
        source: "/:all*\\.(webp|png|jpg|svg|ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
