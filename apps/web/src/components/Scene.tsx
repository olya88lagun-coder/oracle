import Image from "next/image";
import type { ReactNode } from "react";

// Личное пространство («Мой портрет», вход): силуэт с лунным кругом справа, текст слева на тёмной части кадра
export function Scene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <main className={compact ? "scene scene--compact" : "scene"}>
      <div className="scene__art">
        <Image src="/portrait.webp" alt="" fill priority unoptimized sizes="(min-width: 900px) 60vw, 100vw" />
      </div>
      <div className="scene__content page page--wide stack">{children}</div>
    </main>
  );
}
