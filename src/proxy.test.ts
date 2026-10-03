import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessions = vi.hoisted(() => ({ prolongerSession: vi.fn() }));
vi.mock("./comptes/session", () => sessions);
vi.mock("./db", () => ({ getPool: () => ({}) }));

import { reglagesDuCookie } from "./comptes/cookie-session";
import { proxy } from "./proxy";

const FIN = new Date("2026-11-02T12:00:00Z");
const visite = (cookie?: string) => new NextRequest("https://bestia.test/jeu", { headers: cookie ? { cookie } : {} });

describe("prolongation de la session au passage d'une page du jeu", () => {
  beforeEach(() => {
    sessions.prolongerSession.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("renouvelle le cookie quand la session vient d'être prolongée", async () => {
    sessions.prolongerSession.mockResolvedValue(FIN);
    const reponse = await proxy(visite("bestia_session=jeton-de-session"));
    expect(sessions.prolongerSession).toHaveBeenCalledWith({}, "jeton-de-session");
    const cookie = reponse?.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("bestia_session=jeton-de-session");
    expect(cookie).toContain(`Expires=${FIN.toUTCString()}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toContain("Path=/");
  });

  it("ne touche à rien quand la session n'a pas besoin d'être prolongée", async () => {
    sessions.prolongerSession.mockResolvedValue(null);
    expect(await proxy(visite("bestia_session=jeton-de-session"))).toBeUndefined();
  });

  it("ne va pas en base sans cookie de session", async () => {
    expect(await proxy(visite())).toBeUndefined();
    expect(sessions.prolongerSession).not.toHaveBeenCalled();
  });

  it("laisse jouer si la prolongation échoue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sessions.prolongerSession.mockRejectedValue(new Error("base injoignable"));
    expect(await proxy(visite("bestia_session=jeton-de-session"))).toBeUndefined();
  });
});

describe("cookie de session en ligne", () => {
  it("ne circule qu'en HTTPS, reste illisible par la page et ne part vers aucun autre site", () => {
    expect(reglagesDuCookie(FIN, { VERCEL_ENV: "production" })).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/", expires: FIN });
    expect(reglagesDuCookie(FIN, {})).toMatchObject({ httpOnly: true, secure: false });
  });
});
