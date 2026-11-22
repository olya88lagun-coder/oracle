import { moonRibbonData } from "@/lib/moon-ribbon";

// Данные ленты на сегодня по Москве; от момента запроса зависят, поэтому не статика, а CDN держит ответ пять минут
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(moonRibbonData(new Date()), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } });
}
