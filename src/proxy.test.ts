import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessions = vi.hoisted(() => ({ prolongerSession: vi.fn(), compteDeLaSession: vi.fn() }));
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
    // Le témoin de connexion suit la session (US-0122) : prolongé avec elle, lisible par la page.
    const temoin = reponse?.headers.getSetCookie().find((c) => c.startsWith("bestia_connecte=")) ?? "";
    expect(temoin).toContain("bestia_connecte=1");
    expect(temoin).toContain(`Expires=${FIN.toUTCString()}`);
    expect(temoin).not.toMatch(/HttpOnly/i);
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

describe("joueur déjà connecté qui ouvre l'inscription ou la connexion", () => {
  const ouvrir = (chemin: string, options: { cookie?: string; methode?: string; action?: boolean } = {}) =>
    new NextRequest(`https://bestia.test${chemin}`, {
      method: options.methode ?? "GET",
      headers: { ...(options.cookie ? { cookie: options.cookie } : {}), ...(options.action ? { "next-action": "abc" } : {}) },
    });

  beforeEach(() => {
    sessions.compteDeLaSession.mockReset().mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  });

  it.each([
    ["/inscription", "https://bestia.test/jeu"],
    ["/connexion", "https://bestia.test/jeu"],
    ["/connexion?suite=%2Fjeu%2Fterritoire", "https://bestia.test/jeu/territoire"],
    ["/connexion?suite=https%3A%2F%2Fpirate.exemple", "https://bestia.test/jeu"],
  ])("envoie droit au jeu à l'ouverture de %s", async (chemin, vers) => {
    const reponse = await proxy(ouvrir(chemin, { cookie: "bestia_session=jeton-de-session" }));
    expect(reponse?.status).toBe(307);
    expect(reponse?.headers.get("location")).toBe(vers);
  });

  it("laisse un envoi de formulaire afficher sa réponse sur place (la confirmation d'inscription, US-0123)", async () => {
    expect(await proxy(ouvrir("/inscription", { cookie: "bestia_session=jeton-de-session", methode: "POST", action: true }))).toBeUndefined();
  });

  it("laisse passer un visiteur, ou une session expirée", async () => {
    expect(await proxy(ouvrir("/inscription"))).toBeUndefined();
    sessions.compteDeLaSession.mockResolvedValue(null);
    expect(await proxy(ouvrir("/connexion", { cookie: "bestia_session=jeton-perime" }))).toBeUndefined();
  });
});
