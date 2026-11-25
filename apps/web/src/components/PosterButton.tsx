"use client";

import { useEffect, useState } from "react";
import { renderPathPoster, renderPoster, renderThreadPoster, type PathPosterSpec, type PosterSpec, type ThreadPosterSpec } from "@/lib/poster";
import type { MoonPosterSpec } from "@/lib/poster-moon";
import { renderMoonPoster } from "@/lib/poster-moon-render";
import type { WeekdayPosterSpec } from "@/lib/poster-weekday";
import { renderWeekdayPoster } from "@/lib/poster-weekday-render";

// «Картинка для сторис»: рисуется в браузере и скачивается или уходит в окно «Поделиться» вместе с файлом. Ни дат, ни данных на сервер
export function PosterButton({ spec, label = "Картинка для сторис", preview = false }: { spec: PosterSpec | PathPosterSpec | ThreadPosterSpec | MoonPosterSpec | WeekdayPosterSpec; label?: string; preview?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function make() {
    setState("busy");
    try {
      const serif = getComputedStyle(document.querySelector("h1, h2") ?? document.body).fontFamily;
      const fonts = { serif, sans: getComputedStyle(document.body).fontFamily };
      const blob = "weekday" in spec ? await renderWeekdayPoster(spec, fonts) : "moon" in spec ? await renderMoonPoster(spec, fonts) : "thread" in spec ? await renderThreadPoster(spec, fonts) : "trail" in spec ? await renderPathPoster(spec, fonts) : await renderPoster(spec, fonts);
      const file = new File([blob], `${spec.fileName}.png`, { type: "image/png" });
      if (preview) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setState("done");
          return;
        } catch (error) {
          // Закрытое окно «Поделиться» — не ошибка, дальше просто скачиваем
          if (error instanceof DOMException && error.name === "AbortError") {
            setState(preview ? "done" : "idle");
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
      {preview && previewUrl && (
        <figure className="poster-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL из холста в браузере */}
          <img src={previewUrl} alt="Превью картинки для сторис" width={108} height={192} />
        </figure>
      )}
    </>
  );
}
