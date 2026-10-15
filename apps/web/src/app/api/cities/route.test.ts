import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

let nextClient = 0;
// У каждого теста свой адрес клиента: лимит считается по адресу и живёт в памяти процесса
const freshClient = () => `10.1.0.${(nextClient += 1)}`;
const call = (query: string | null, client = freshClient()) =>
  GET(new NextRequest(`http://localhost/api/cities${query === null ? "" : `?q=${encodeURIComponent(query)}`}`, { headers: { "x-forwarded-for": client } }));

afterEach(() => vi.restoreAllMocks());

describe("GET /api/cities", () => {
  test("finds cities by the start of the name, biggest first, with a day-long cache", async () => {
    const response = await call("моск");
    const body = (await response.json()) as { cities: { name: string; zone: string }[] };

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
    expect(body.cities[0]?.name).toBe("Москва");
    expect(body.cities[0]?.zone).toBe("Europe/Moscow");
    expect(body.cities.length).toBeLessThanOrEqual(8);
  });

  test("answers 400 without caching for a missing, empty, one-letter or too long query", async () => {
    for (const query of [null, "", " ", "м", "м".repeat(41), "м".repeat(5000)]) {
      const response = await call(query);
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({ ok: false, error: "invalid" });
    }
  });

  test("accepts a query of exactly 2 and exactly 40 characters", async () => {
    expect((await call("мо")).status).toBe(200);
    expect((await call("м".repeat(40))).status).toBe(200);
  });

  test("answers 429 on the 31st request in a minute from one client and counts clients separately", async () => {
    const client = freshClient();
    for (let i = 0; i < 30; i += 1) expect((await call("моск", client)).status).toBe(200);

    const limited = await call("моск", client);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("cache-control")).toBe("no-store");
    expect(await limited.json()).toEqual({ ok: false, error: "rate_limited" });
    expect((await call("моск")).status).toBe(200);
  });

  test("never writes the query text to any log", async () => {
    const logs = (["log", "info", "warn", "error", "debug"] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

    await call("секретный запрос");
    await call("м");

    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });
});
