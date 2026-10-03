import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pot = vi.hoisted(() => ({ cookies: new Map<string, { value: string; options?: Record<string, unknown> }>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nom: string) => (pot.cookies.has(nom) ? { value: pot.cookies.get(nom)!.value } : undefined),
    set: (nom: string, value: string, options: Record<string, unknown>) => pot.cookies.set(nom, { value, options }),
  }),
}));
const sessions = vi.hoisted(() => ({ fermerSession: vi.fn(async () => {}), compteDeLaSession: vi.fn() }));
vi.mock("./session", () => sessions);
vi.mock("@/db", () => ({ getPool: () => ({}) }));

import { seDeconnecter } from "./deconnexion";

describe("se déconnecter", () => {
  beforeEach(() => {
    pot.cookies.clear();
    sessions.fermerSession.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("supprime la session en base et efface le cookie", async () => {
    pot.cookies.set("bestia_session", { value: "jeton-de-session" });
    await seDeconnecter();
    expect(sessions.fermerSession).toHaveBeenCalledWith({}, "jeton-de-session");
    expect(pot.cookies.get("bestia_session")).toMatchObject({ value: "", options: { maxAge: 0, httpOnly: true, path: "/" } });
    // Le témoin de connexion (US-0122) part avec la session.
    expect(pot.cookies.get("bestia_connecte")).toMatchObject({ value: "", options: { maxAge: 0, path: "/" } });
  });

  it("efface en ligne le cookie __Host- avec ses réglages HTTPS, sans quoi le navigateur l'ignorerait", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    pot.cookies.set("__Host-bestia_session", { value: "jeton-de-session" });
    await seDeconnecter();
    expect(pot.cookies.get("__Host-bestia_session")).toMatchObject({ value: "", options: { maxAge: 0, secure: true, path: "/" } });
  });

  it("ne va pas en base sans session", async () => {
    await seDeconnecter();
    expect(sessions.fermerSession).not.toHaveBeenCalled();
  });
});

describe("à la connexion", () => {
  it("pose avec la session un témoin lisible par la page, sans aucun secret, qui dure autant qu'elle", async () => {
    pot.cookies.clear();
    const fin = new Date("2026-11-02T12:00:00Z");
    const { poserCookieSession } = await import("./cookie-session");
    await poserCookieSession("jeton-de-session", fin);
    expect(pot.cookies.get("bestia_session")).toMatchObject({ value: "jeton-de-session", options: { httpOnly: true, expires: fin } });
    expect(pot.cookies.get("bestia_connecte")).toMatchObject({ value: "1", options: { httpOnly: false, expires: fin, sameSite: "lax" } });
  });
});
