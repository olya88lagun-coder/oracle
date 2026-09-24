import { describe, expect, test } from "vitest";
import { signConsent, signSession, signVkState, verifyConsent, verifySession, verifyVkState } from "./tokens";

const SECRET = "a".repeat(64);

describe("session tokens", () => {
  test("round-trip a user id", async () => {
    expect(await verifySession(await signSession("user-1", SECRET), SECRET)).toBe("user-1");
  });

  test("reject another secret and garbage", async () => {
    expect(await verifySession(await signSession("user-1", "b".repeat(64)), SECRET)).toBeNull();
    expect(await verifySession("not-a-jwt", SECRET)).toBeNull();
  });
});

describe("vk state tokens", () => {
  test("round-trip the state and verifier", async () => {
    const payload = { state: "st-1", codeVerifier: "ver-1" };

    expect(await verifyVkState(await signVkState(payload, SECRET), SECRET)).toEqual(payload);
  });
});

describe("consent tokens", () => {
  test("round-trip the version and time with second precision", async () => {
    const consent = { version: "2026-09-v1", at: new Date("2026-09-24T10:00:00.750Z") };

    expect(await verifyConsent(await signConsent(consent, SECRET), SECRET)).toEqual({ version: "2026-09-v1", at: new Date("2026-09-24T10:00:00.000Z") });
  });
});

describe("audiences", () => {
  test("a token of one kind is never accepted as another", async () => {
    const session = await signSession("user-1", SECRET);
    const consent = await signConsent({ version: "v", at: new Date() }, SECRET);
    const state = await signVkState({ state: "s", codeVerifier: "v" }, SECRET);

    expect(await verifyConsent(session, SECRET)).toBeNull();
    expect(await verifySession(consent, SECRET)).toBeNull();
    expect(await verifyVkState(session, SECRET)).toBeNull();
    expect(await verifySession(state, SECRET)).toBeNull();
  });
});
