"use client";

import { browserStorage, clearStoredBirthDate } from "@/lib/birth-date-storage";

// Обычная форма выхода; перед отправкой стираем дату из браузера, чтобы она не пережила выход на общем устройстве
export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post" onSubmit={() => clearStoredBirthDate(browserStorage())}>
      <button type="submit" className="button button--ghost">
        Выйти
      </button>
    </form>
  );
}
