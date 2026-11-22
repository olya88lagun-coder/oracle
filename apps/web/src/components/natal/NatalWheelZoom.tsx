"use client";

import type { NatalChart } from "@oracle/core/natal";
import { useRef, useState } from "react";
import { NatalWheel, type NatalBirth } from "./NatalWheel";

export function NatalWheelZoom({ chart, birth }: { chart: NatalChart; birth: NatalBirth }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);

  function close() {
    dialog.current?.close();
    setOpened(false);
    opener.current?.focus();
  }

  return (
    <div className="natal-wheel-zoom">
      <button ref={opener} type="button" className="button button--ghost natal-wheel-zoom__button" onClick={() => { setOpened(true); dialog.current?.showModal(); }}>
        Рассмотреть карту крупнее
      </button>
      <dialog ref={dialog} className="natal-wheel-dialog" aria-label="Натальная карта крупнее" onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => { setOpened(false); opener.current?.focus(); }}>
        <div className="natal-wheel-dialog__head">
          <p>Натальная карта</p>
          <button type="button" className="button button--ghost" onClick={close}>Закрыть карту</button>
        </div>
        <p className="natal-wheel-dialog__hint">Прокручивайте карту, чтобы рассмотреть символы и градусы.</p>
        <div className="natal-wheel-dialog__viewport" tabIndex={0} role="region" aria-label="Увеличенное колесо с прокруткой">
          {opened && <NatalWheel chart={chart} birth={birth} />}
        </div>
      </dialog>
    </div>
  );
}
