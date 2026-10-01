import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { YANDEX_VERIFICATION } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Шрифты лежат в репозитории (src/app/fonts, лицензия OFL): сборка не ходит на fonts.google.com и не зависит от внешней сети.
// Manrope — вариативный по весу; заголовки — тонкая контрастная антиква Noto Serif Display, веса 300–400.
// Подмножество: латиница, кириллица, пунктуация, № и ₽ (скрипт и описание — docs/fonts.md)
const manrope = localFont({ src: "./fonts/Manrope-latin-cyrillic.woff2", weight: "200 800", style: "normal", display: "swap", variable: "--font-manrope", fallback: ["system-ui", "sans-serif"] });
const notoSerifDisplay = localFont({ src: "./fonts/NotoSerifDisplay-latin-cyrillic.woff2", weight: "300 400", style: "normal", display: "swap", variable: "--font-noto-display", adjustFontFallback: "Times New Roman", fallback: ["Georgia", "Times New Roman", "serif"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — символические практики для самопознания`, template: `%s — ${SITE_NAME}` },
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  // По умолчанию страницы закрыты от поиска: вход и портрет личные. Публичные страницы включают индексацию через publicMetadata
  robots: { index: false, follow: false },
  ...(YANDEX_VERIFICATION ? { verification: { yandex: YANDEX_VERIFICATION } } : {}),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${notoSerifDisplay.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
