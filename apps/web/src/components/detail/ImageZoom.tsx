"use client";

import Image from "next/image";
import { useRef } from "react";

type Props = { src: string; fullSrc: string; alt: string; width: number; height: number; priority?: boolean; className?: string };

// Иллюстрация с кнопкой «Увеличить»: оригинал целиком в диалоге; Escape и кнопка закрывают, фокус возвращается на кнопку
export function ImageZoom({ src, fullSrc, alt, width, height, priority, className }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  function close() {
    dialogRef.current?.close();
    openerRef.current?.focus();
  }

  return (
    <div className="detail-media__frame">
      <Image className={className} src={src} alt={alt} width={width} height={height} priority={priority} unoptimized />
      <button ref={openerRef} type="button" className="detail-zoom" aria-label="Увеличить изображение" title="Увеличить изображение" onClick={() => dialogRef.current?.showModal()}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
        </svg>
      </button>
      <dialog
        ref={dialogRef}
        className="detail-dialog"
        aria-label={alt}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        {/* Увеличенная картинка подгружается только при открытии диалога */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fullSrc} alt={alt} loading="lazy" />
        <button type="button" className="detail-dialog__close" aria-label="Закрыть изображение" title="Закрыть" onClick={close}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </dialog>
    </div>
  );
}
