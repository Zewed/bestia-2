import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONNEXION_REFUSEE, connexionBloquee, ETAT_CONNEXION_INITIAL } from "./etat";

// Les identifiants et les sessions ont leurs tests sur base (src/comptes/connexion.db.test.ts).
const connexion = vi.hoisted(() => ({ seConnecterAvecFrein: vi.fn(), noterConnexion: vi.fn(async () => {}) }));
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

const envoi = (email: string, motDePasse: string, suite = "/jeu") => {
  const donnees = new FormData();
  donnees.set("email", email);
  donnees.set("motDePasse", motDePasse);
  donnees.set("suite", suite);
  return seConnecter(ETAT_CONNEXION_INITIAL, donnees);
};
const FIN = new Date("2026-11-02T12:00:00Z");

describe("envoi du formulaire de connexion", () => {
  beforeEach(() => {
    vi.stubEnv("EMPREINTE_RESEAU_SECRET", "secret-de-test");
    connexion.seConnecterAvecFrein.mockReset();
    connexion.noterConnexion.mockClear();
    sessions.ouvrirSession.mockReset().mockResolvedValue({ jeton: "jeton-de-session", expireLe: FIN });
    cookie.poserCookieSession.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ouvre une session, note la connexion et mène au jeu quand les identifiants sont justes", async () => {
    connexion.seConnecterAvecFrein.mockResolvedValue({ statut: "acceptee", compte: { id: 7, email: "nom@exemple.fr" } });
    await expect(envoi("Nom@Exemple.fr", "une phrase de passe")).rejects.toMatchObject({ vers: "/jeu" });
    expect(connexion.seConnecterAvecFrein.mock.calls[0][1]).toMatchObject({ email: "Nom@Exemple.fr", motDePasse: "une phrase de passe" });
    expect(sessions.ouvrirSession).toHaveBeenCalledWith({}, 7);
    expect(connexion.noterConnexion).toHaveBeenCalledWith({}, 7);
    expect(cookie.poserCookieSession).toHaveBeenCalledWith("jeton-de-session", FIN);
  });

  it("mène, une fois connecté, à la page du jeu demandée avant la connexion", async () => {
    connexion.seConnecterAvecFrein.mockResolvedValue({ statut: "acceptee", compte: { id: 7, email: "nom@exemple.fr" } });
    await expect(envoi("nom@exemple.fr", "une phrase de passe", "/jeu/territoire")).rejects.toMatchObject({ vers: "/jeu/territoire" });
  });

  it("ne suit jamais un retour vers un autre site", async () => {
    connexion.seConnecterAvecFrein.mockResolvedValue({ statut: "acceptee", compte: { id: 7, email: "nom@exemple.fr" } });
    await expect(envoi("nom@exemple.fr", "une phrase de passe", "https://pirate.exemple")).rejects.toMatchObject({ vers: "/jeu" });
  });

  it("freine par adresse, sous sa forme normale, sans la garder en clair", async () => {
    connexion.seConnecterAvecFrein.mockResolvedValue({ statut: "refusee" });
    await envoi("Nom@Exemple.fr", "faux");
    await envoi(" nom@exemple.fr ", "faux");
    const [premiere, seconde] = connexion.seConnecterAvecFrein.mock.calls.map(([, essai]) => essai.empreinteAdresse);
    expect(premiere).toMatch(/^[0-9a-f]{64}$/);
    expect(seconde).toBe(premiere);
  });

  it("refuse avec un seul message, garde l'adresse, et n'ouvre rien", async () => {
    connexion.seConnecterAvecFrein.mockResolvedValue({ statut: "refusee" });
    expect(await envoi("nom@exemple.fr", "faux")).toEqual({ erreur: CONNEXION_REFUSEE, email: "nom@exemple.fr" });
    expect(sessions.ouvrirSession).not.toHaveBeenCalled();
    expect(cookie.poserCookieSession).not.toHaveBeenCalled();
  });

  it("dit combien de temps attendre quand les essais sont bloqués", async () => {
    connexion.seConnecterAvecFrein.mockResolvedValue({ statut: "bloquee", minutes: 15 });
    expect(await envoi("nom@exemple.fr", "une phrase de passe")).toEqual({ erreur: "Trop d'essais. Réessayez dans 15 minutes.", email: "nom@exemple.fr" });
    expect(sessions.ouvrirSession).not.toHaveBeenCalled();
    expect(connexionBloquee(1)).toBe("Trop d'essais. Réessayez dans 1 minute.");
  });

  it("refuse un mot de passe démesuré sans même le vérifier", async () => {
    expect(await envoi("nom@exemple.fr", "a".repeat(129))).toEqual({ erreur: CONNEXION_REFUSEE, email: "nom@exemple.fr" });
    expect(connexion.seConnecterAvecFrein).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await envoi("nom@exemple.fr", "une phrase de passe")).toEqual(ETAT_CONNEXION_INITIAL);
    expect(connexion.seConnecterAvecFrein).not.toHaveBeenCalled();
  });
});
