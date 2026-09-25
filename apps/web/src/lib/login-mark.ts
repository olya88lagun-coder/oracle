// Вход — серверный редирект, поэтому цель Метрики отмечается меткой в адресе и снимается на первой странице после входа
export const LOGIN_MARK = { param: "from", value: "login" } as const;

// Хост не важен: нужен только разбор пути; наружу уходят путь, параметры и якорь
const PARSE_BASE = "http://localhost";

export function withLoginMark(path: string): string {
  const url = new URL(path, PARSE_BASE);
  url.searchParams.set(LOGIN_MARK.param, LOGIN_MARK.value);
  return `${url.pathname}${url.search}${url.hash}`;
}
