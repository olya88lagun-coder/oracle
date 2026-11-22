import { beforeEach, describe, expect, test, vi } from "vitest";
import { PLACE_KEY, placeFromCity } from "./moon-place";

const CITY = { id: 1496747, name: "Новосибирск", region: "Новосибирская область", country: "Россия", latitude: 55.0415, longitude: 82.9346, zone: "Asia/Novosibirsk", population: 1_500_000 };
const memory = () => {
  const map = new Map<string, string>();
  return { map, getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => void map.set(key, value), removeItem: (key: string) => void map.delete(key) };
};
const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } };

beforeEach(() => vi.resetModules());

describe("moon place store", () => {
  test("setPlace stores the record and getPlace returns it; setPlace(null) removes the record", async () => {
    const store = await import("./moon-place-store");
    const storage = memory();
    store.setPlace(placeFromCity(CITY), storage);
    expect(store.getPlace()).toEqual(placeFromCity(CITY));
    expect(JSON.parse(storage.map.get(PLACE_KEY)!)).toEqual(placeFromCity(CITY));
    store.setPlace(null, storage);
    expect(store.getPlace()).toBeNull();
    expect(storage.map.has(PLACE_KEY)).toBe(false);
  });

  test("setPlace survives a storage that throws: the choice lives in memory", async () => {
    const store = await import("./moon-place-store");
    expect(() => store.setPlace(placeFromCity(CITY), broken)).not.toThrow();
    expect(store.getPlace()).toEqual(placeFromCity(CITY));
    expect(() => store.setPlace(null, null)).not.toThrow();
    expect(store.getPlace()).toBeNull();
  });

  test("subscribePlace notifies on change and stops after unsubscribe", async () => {
    const store = await import("./moon-place-store");
    const listener = vi.fn();
    const stop = store.subscribePlace(listener);
    store.setPlace(placeFromCity(CITY), memory());
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    store.setPlace(null, memory());
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("getPlace is null on the server before anything is set", async () => {
    const store = await import("./moon-place-store");
    expect(store.getPlace()).toBeNull();
  });
});
