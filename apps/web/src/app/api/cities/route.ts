import { buildCityIndex, CITIES, MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, normalizeQuery, searchCities, type CityIndex } from "@oracle/geo";
import { NextResponse, type NextRequest } from "next/server";
import { citiesLimiter, clientKeyFromHeaders } from "@/server/rate-limit";

// Запрос длиннее этого не разбираем вовсе: нормализовать мегабайты ради отказа незачем
const MAX_RAW_QUERY_LENGTH = 200;
const NO_STORE = { "cache-control": "no-store" };
// Ответ зависит только от текста запроса и базы городов, поэтому его можно держать в кэше браузера и прокси сутки
const CACHEABLE = { "cache-control": "public, max-age=86400" };

let index: CityIndex | null = null;
const cityIndex = (): CityIndex => (index ??= buildCityIndex(CITIES));

// Текст запроса — место, которое человек ищет, — нигде не логируется и не сохраняется
export function GET(request: NextRequest) {
  if (!citiesLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const length = query.length > MAX_RAW_QUERY_LENGTH ? Infinity : normalizeQuery(query).length;
  if (length < MIN_QUERY_LENGTH || length > MAX_QUERY_LENGTH) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400, headers: NO_STORE });
  return NextResponse.json({ cities: searchCities(cityIndex(), query) }, { headers: CACHEABLE });
}
