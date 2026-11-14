"use client";

import { useState } from "react";
import { renderPathPoster, renderPoster, type PathPosterSpec, type PosterSpec } from "@/lib/poster";

// «Картинка для сторис»: рисуется в браузере и скачивается или уходит в окно «Поделиться» вместе с файлом. Ни дат, ни данных на сервер
export function PosterButton({ spec, label = "Картинка для сторис" }: { spec: PosterSpec | PathPosterSpec; label?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function make() {
    setState("busy");
    try {
      const serif = getComputedStyle(document.querySelector("h1, h2") ?? document.body).fontFamily;
      const fonts = { serif, sans: getComputedStyle(document.body).fontFamily };
      const blob = "trail" in spec ? await renderPathPoster(spec, fonts) : await renderPoster(spec, fonts);
      const file = new File([blob], `${spec.fileName}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setState("done");
          return;
        } catch (error) {
          // Закрытое окно «Поделиться» — не ошибка, дальше просто скачиваем
          if (error instanceof DOMException && error.name === "AbortError") {
            setState("idle");
            return;
          }
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <button type="button" className="button button--ghost" onClick={() => void make()} disabled={state === "busy"}>
        {state === "busy" ? "Рисуем…" : label}
      </button>
      {state === "done" && <span role="status">Картинка готова — в ней нет личных данных.</span>}
      {state === "error" && <span role="alert">Не получилось нарисовать картинку.</span>}
    </>
  );
}
