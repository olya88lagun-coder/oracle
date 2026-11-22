import { beforeEach, describe, expect, test, vi } from "vitest";
import type { MonthPage } from "./lunar-calendar";
import { placeFromCity } from "./moon-place";
import { clearMonthCache, getMonthPage } from "./moon-month-cache";

const NOVOSIBIRSK = placeFromCity({ id: 1496747, name: "Новосибирск", region: "", country: "Россия", latitude: 55.04, longitude: 82.93, zone: "Asia/Novosibirsk", population: 1_500_000 });
const BERLIN = placeFromCity({ id: 2950159, name: "Берлин", region: "", country: "Германия", latitude: 52.52, longitude: 13.4, zone: "Europe/Berlin", population: 3_600_000 });
const NOW = new Date("2026-11-22T09:00:00Z");
const page = { year: 2026, month: 11 } as unknown as MonthPage;

beforeEach(() => clearMonthCache());

describe("getMonthPage", () => {
  test("computes once per place and month, and again for another place or month", async () => {
    const load = vi.fn(async () => page);
    await Promise.all([getMonthPage(NOVOSIBIRSK, 2026, 11, NOW, load), getMonthPage(NOVOSIBIRSK, 2026, 11, NOW, load)]);
    expect(load).toHaveBeenCalledTimes(1);
    await getMonthPage(BERLIN, 2026, 11, NOW, load);
    await getMonthPage(NOVOSIBIRSK, 2026, 12, NOW, load);
    expect(load).toHaveBeenCalledTimes(3);
  });

  test("a failed calculation is dropped from the cache, so the next call tries again", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("chunk failed")).mockResolvedValueOnce(page);
    await expect(getMonthPage(NOVOSIBIRSK, 2026, 11, NOW, load)).rejects.toThrow("chunk failed");
    await expect(getMonthPage(NOVOSIBIRSK, 2026, 11, NOW, load)).resolves.toBe(page);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
