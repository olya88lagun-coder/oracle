import type { Metadata } from "next";
import { Manrope, Noto_Serif_Display } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { YANDEX_VERIFICATION } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "600", "800"], variable: "--font-manrope" });
// Заголовки — тонкая контрастная антиква; шрифты next/font скачивает при сборке и отдаёт с нашего домена
const display = Noto_Serif_Display({ subsets: ["latin", "cyrillic"], weight: ["300", "400"], variable: "--font-noto-display" });

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
    <html lang="ru" className={`${body.variable} ${display.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
