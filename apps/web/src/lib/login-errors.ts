const MESSAGES: Readonly<Record<string, string>> = {
  consent_required: "Чтобы войти в первый раз, отметьте согласие на обработку данных и попробуйте ещё раз.",
  vk_state_mismatch: "Вход через VK ID занял слишком много времени. Попробуйте ещё раз.",
  vk_missing_params: "VK ID не вернул данные для входа. Попробуйте ещё раз.",
};

const FALLBACK = "Не получилось войти через VK ID. Попробуйте ещё раз чуть позже.";

export function loginErrorMessage(code: string | null): string | null {
  if (code === null) return null;
  return MESSAGES[code] ?? FALLBACK;
}
