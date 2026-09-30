import path from "node:path";
import type { NextConfig } from "next";

// `next build` запускается из apps/web (pnpm --filter), корень монорепо — на два уровня выше
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: ["@oracle/core", "@oracle/content", "@oracle/db"],
  // pdfkit читает свои шрифтовые данные с диска, поэтому его нельзя собирать в бандл
  serverExternalPackages: ["pdfkit"],
  poweredByHeader: false,
  // Значок разработки в углу перекрывал текст на локальных просмотрах; ошибки сборки Next.js показывает и без него
  devIndicators: false,
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
    ];
  },
};

export default nextConfig;
