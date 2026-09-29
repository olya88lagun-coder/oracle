import { describe, expect, test } from "vitest";
import { guestApi, lilaErrorMessage } from "./lila-api";
import { guestStart, readGuestGame, writeGuestGame } from "./lila-guest";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
};
const ready = () => {
  const storage = memory();
  writeGuestGame(storage, guestStart("Что мне важно увидеть?"));
  return storage;
};

describe("guestApi", () => {
  test("rolls with the injected dice, marks a custom die and keeps notes", async () => {
    const storage = ready();
    const api = guestApi(storage, () => 6);
    const first = await api.roll();
    expect(first).toMatchObject({ ok: true, game: { position: 1, movesCount: 1 } });
    const second = await api.roll(4);
    expect(second).toMatchObject({ ok: true, game: { position: 5 } });
    if (second.ok) expect(second.game.moves.at(-1)?.customDie).toBe(true);
    const noted = await api.saveNote(2, "  Заметила.  ");
    if (noted.ok) expect(noted.game.moves[1]?.note).toBe("Заметила.");
    expect(readGuestGame(storage)?.moves).toHaveLength(2);
  });

  test("finishes a game, then refuses further moves", async () => {
    const api = guestApi(ready(), () => 6);
    await api.roll();
    expect(await api.finish()).toMatchObject({ ok: true, game: { status: "abandoned" } });
    expect(await api.roll()).toEqual({ ok: false, error: "not_active" });
  });

  test("reports a missing game", async () => {
    expect(await guestApi(memory()).roll()).toEqual({ ok: false, error: "not_found" });
  });
});

describe("lilaErrorMessage", () => {
  test("has a text for known errors and a general one for the rest", () => {
    expect(lilaErrorMessage("limit")).toMatch(/120/);
    expect(lilaErrorMessage("boom")).toBe("Не получилось. Попробуйте ещё раз.");
  });
});
