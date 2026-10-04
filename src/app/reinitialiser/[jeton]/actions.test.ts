import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOT_DE_PASSE_TROP_COURT } from "@/comptes/mot-de-passe";
import { ETAT_NOUVEAU_INITIAL } from "./etat";

const reinitialisation = vi.hoisted(() => ({ changerMotDePasse: vi.fn() }));
vi.mock("@/comptes/reinitialisation", () => reinitialisation);
const sessions = vi.hoisted(() => ({ ouvrirSession: vi.fn() }));
vi.mock("@/comptes/session", () => sessions);
const connexion = vi.hoisted(() => ({ noterConnexion: vi.fn(async () => {}) }));
vi.mock("@/comptes/connexion", () => connexion);
const cookie = vi.hoisted(() => ({ poserCookieSession: vi.fn(async () => {}) }));
vi.mock("@/comptes/cookie-session", () => cookie);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/navigation", () => ({
  redirect: (vers: string) => {
    throw Object.assign(new Error("redirection"), { vers });
  },
}));

import { choisirMotDePasse } from "./actions";

const FIN = new Date("2026-11-03T12:00:00Z");
const envoi = (motDePasse: string) => {
  const donnees = new FormData();
  donnees.set("motDePasse", motDePasse);
  return choisirMotDePasse("jeton123", ETAT_NOUVEAU_INITIAL, donnees);
};

describe("choisir un nouveau mot de passe", () => {
  beforeEach(() => {
    reinitialisation.changerMotDePasse.mockReset().mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    sessions.ouvrirSession.mockReset().mockResolvedValue({ jeton: "jeton-de-session", expireLe: FIN });
    cookie.poserCookieSession.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("change le mot de passe, connecte le joueur et l'emmène dans son jeu", async () => {
    await expect(envoi("le nouveau mot de passe")).rejects.toMatchObject({ vers: "/jeu" });
    expect(reinitialisation.changerMotDePasse).toHaveBeenCalledWith({}, "jeton123", "le nouveau mot de passe");
    expect(sessions.ouvrirSession).toHaveBeenCalledWith({}, 7);
    expect(connexion.noterConnexion).toHaveBeenCalledWith({}, 7);
    expect(cookie.poserCookieSession).toHaveBeenCalledWith("jeton-de-session", FIN);
  });

  it("applique les règles de l'inscription, sans rien changer", async () => {
    expect(await envoi("court")).toEqual({ erreur: MOT_DE_PASSE_TROP_COURT });
    expect(reinitialisation.changerMotDePasse).not.toHaveBeenCalled();
  });

  it("dit que le lien ne sert plus, sans ouvrir de session", async () => {
    reinitialisation.changerMotDePasse.mockResolvedValue(null);
    expect(await envoi("le nouveau mot de passe")).toEqual({ lienPerime: true });
    expect(sessions.ouvrirSession).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await envoi("le nouveau mot de passe")).toEqual(ETAT_NOUVEAU_INITIAL);
    expect(reinitialisation.changerMotDePasse).not.toHaveBeenCalled();
  });
});
