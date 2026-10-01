"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Board } from "./Board";

type Props = { current: number; trail: number[] };

// «Рассмотреть поле»: то же поле в окне на весь экран; закрывается кнопкой и Esc, фокус возвращается на кнопку
export function BoardZoom({ current, trail }: Props) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <>
      <button ref={opener} type="button" className="board-zoom" onClick={() => setOpen(true)}>
        <Icon name="maximize-2" />
        Рассмотреть поле
      </button>
      <dialog
        ref={dialog}
        className="board-dialog"
        aria-label="Поле Лилы"
        onClose={() => {
          setOpen(false);
          opener.current?.focus();
        }}
      >
        <button type="button" className="board-dialog__close" aria-label="Закрыть" onClick={() => setOpen(false)}>
          <Icon name="x" size={20} />
        </button>
        {open && (
          <>
            <Board current={current} trail={trail} variant="full" />
            <Board current={current} trail={trail} variant="compact" />
          </>
        )}
      </dialog>
    </>
  );
}
