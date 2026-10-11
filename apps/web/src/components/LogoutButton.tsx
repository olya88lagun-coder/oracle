"use client";

import { browserStorage, clearStoredBirthDate } from "@/lib/birth-date-storage";
import { clearLilaDraft } from "@/lib/lila-draft";
import { Icon } from "./Icon";

// Обычная форма выхода; перед отправкой стираем дату из браузера, чтобы она не пережила выход на общем устройстве
export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post" onSubmit={() => { clearStoredBirthDate(browserStorage()); clearLilaDraft(); }}>
      <button type="submit" className="account-action">
        <Icon name="log-out" />
        Выйти
      </button>
    </form>
  );
}
