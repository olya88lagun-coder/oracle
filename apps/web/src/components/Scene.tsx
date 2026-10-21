import Image from "next/image";
import type { ReactNode } from "react";

// Личное пространство («Мой портрет», вход): силуэт с лунным кругом справа, текст слева на тёмной части кадра.
// art={false} — без силуэта (страница несёт собственную картинку, например Лила)
export function Scene({ children, compact = false, art = true }: { children: ReactNode; compact?: boolean; art?: boolean }) {
  const modifiers = [compact && "scene--compact", !art && "scene--plain"].filter(Boolean).join(" ");
  return (
    <main className={modifiers ? `scene ${modifiers}` : "scene"}>
      {art && (
        <div className="scene__art">
          <Image src="/portrait.webp" alt="" fill priority unoptimized sizes="(min-width: 900px) 60vw, 100vw" />
        </div>
      )}
      <div className="scene__content page page--wide stack">{children}</div>
    </main>
  );
}
