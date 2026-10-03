import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONNEXION_REFUSEE, ETAT_CONNEXION_INITIAL } from "./etat";

// Les identifiants et les sessions ont leurs tests sur base (src/comptes/connexion.db.test.ts).
const connexion = vi.hoisted(() => ({ verifierIdentifiants: vi.fn(), noterConnexion: vi.fn(async () => {}) }));
vi.mock("@/comptes/connexion", () => connexion);
const sessions = vi.hoisted(() => ({ ouvrirSession: vi.fn() }));
vi.mock("@/comptes/session", () => sessions);
const cookie = vi.hoisted(() => ({ poserCookieSession: vi.fn(async () => {}) }));
vi.mock("@/comptes/cookie-session", () => cookie);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
// redirect interrompt l'envoi, comme dans Next : on la remplace par une erreur reconnaissable.
vi.mock("next/navigation", () => ({
  redirect: (vers: string) => {
    throw Object.assign(new Error("redirection"), { vers });
  },
}));

import { seConnecter } from "./actions";

const envoi = (email: string, motDePasse: string) => {
  const donnees = new FormData();
  donnees.set("email", email);
  donnees.set("motDePasse", motDePasse);
  return seConnecter(ETAT_CONNEXION_INITIAL, donnees);
};
const FIN = new Date("2026-11-02T12:00:00Z");

describe("envoi du formulaire de connexion", () => {
  beforeEach(() => {
    connexion.verifierIdentifiants.mockReset();
    connexion.noterConnexion.mockClear();
    sessions.ouvrirSession.mockReset().mockResolvedValue({ jeton: "jeton-de-session", expireLe: FIN });
    cookie.poserCookieSession.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ouvre une session, note la connexion et mène au jeu quand les identifiants sont justes", async () => {
    connexion.verifierIdentifiants.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    await expect(envoi("Nom@Exemple.fr", "une phrase de passe")).rejects.toMatchObject({ vers: "/jeu" });
    expect(connexion.verifierIdentifiants).toHaveBeenCalledWith({}, "Nom@Exemple.fr", "une phrase de passe");
    expect(sessions.ouvrirSession).toHaveBeenCalledWith({}, 7);
    expect(connexion.noterConnexion).toHaveBeenCalledWith({}, 7);
    expect(cookie.poserCookieSession).toHaveBeenCalledWith("jeton-de-session", FIN);
  });

  it("refuse avec un seul message, garde l'adresse, et n'ouvre rien", async () => {
    connexion.verifierIdentifiants.mockResolvedValue(null);
    expect(await envoi("nom@exemple.fr", "faux")).toEqual({ erreur: CONNEXION_REFUSEE, email: "nom@exemple.fr" });
    expect(sessions.ouvrirSession).not.toHaveBeenCalled();
    expect(cookie.poserCookieSession).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe démesuré sans même le vérifier", async () => {
    expect(await envoi("nom@exemple.fr", "a".repeat(129))).toEqual({ erreur: CONNEXION_REFUSEE, email: "nom@exemple.fr" });
    expect(connexion.verifierIdentifiants).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await envoi("nom@exemple.fr", "une phrase de passe")).toEqual(ETAT_CONNEXION_INITIAL);
    expect(connexion.verifierIdentifiants).not.toHaveBeenCalled();
  });
});
