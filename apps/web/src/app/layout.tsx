import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "600", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — символические практики для самопознания`, template: `%s — ${SITE_NAME}` },
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  // По умолчанию страницы закрыты от поиска: вход и портрет личные. Публичные страницы включают индексацию через publicMetadata
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={body.variable}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
