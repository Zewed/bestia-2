import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMAIL_DEJA_UTILISEE, EMAIL_INVALIDE, EMAIL_VIDE } from "@/comptes/email";
import { MOT_DE_PASSE_TROP_COURT, MOT_DE_PASSE_TROP_LONG } from "@/comptes/mot-de-passe";

// La création en base a ses propres tests (src/comptes/compte.db.test.ts) ; ici, on regarde ce que l'envoi en fait.
const comptes = vi.hoisted(() => ({ creerCompte: vi.fn() }));
vi.mock("@/comptes/compte", () => comptes);
const POOL = vi.hoisted(() => ({ pool: "de test" }));
vi.mock("@/db", () => ({ getPool: () => POOL }));

import { inscrire } from "./actions";
import { ETAT_INITIAL } from "./etat";

const envoi = (email: string, motDePasse = "une phrase de passe") => {
  const donnees = new FormData();
  donnees.set("email", email);
  donnees.set("motDePasse", motDePasse);
  return inscrire(ETAT_INITIAL, donnees);
};

describe("envoi du formulaire d'inscription", () => {
  beforeEach(() => {
    comptes.creerCompte.mockReset();
    comptes.creerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", creeLe: new Date() });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["nom@", EMAIL_INVALIDE],
    ["nom.fr", EMAIL_INVALIDE],
    ["", EMAIL_VIDE],
  ])("refait la vérification du navigateur : « %s » est refusée", async (email, message) => {
    expect(await envoi(email)).toEqual({ erreurs: { email: message }, email });
  });

  it.each([
    ["trop court", "court", MOT_DE_PASSE_TROP_COURT],
    ["démesuré", "a".repeat(129), MOT_DE_PASSE_TROP_LONG],
  ])("refait la vérification du mot de passe : un mot de passe %s est refusé", async (_, motDePasse, message) => {
    expect(await envoi("nom@exemple.fr", motDePasse)).toEqual({ erreurs: { motDePasse: message }, email: "nom@exemple.fr" });
  });

  it("ne renvoie jamais le mot de passe au formulaire", async () => {
    expect(JSON.stringify(await envoi("nom@", "court-secret"))).not.toContain("court-secret");
  });

  it("crée le compte quand le formulaire est valide", async () => {
    expect(await envoi("Nom@Exemple.fr")).toEqual({ erreurs: {}, email: "Nom@Exemple.fr", cree: true });
    expect(comptes.creerCompte).toHaveBeenCalledWith(POOL, "Nom@Exemple.fr", "une phrase de passe");
  });

  it("ne crée rien quand un champ est refusé", async () => {
    await envoi("nom@");
    await envoi("nom@exemple.fr", "court");
    expect(comptes.creerCompte).not.toHaveBeenCalled();
  });

  it("dit quand l'adresse a déjà un compte", async () => {
    comptes.creerCompte.mockResolvedValue(null);
    expect(await envoi("nom@exemple.fr")).toEqual({ erreurs: { email: EMAIL_DEJA_UTILISEE }, email: "nom@exemple.fr" });
  });

  it("n'écrit jamais le mot de passe dans un journal", async () => {
    const journal = (["log", "info", "warn", "error", "debug"] as const).map((niveau) => vi.spyOn(console, niveau));
    await envoi("nom@exemple.fr", "un secret bien gardé");
    await envoi("nom@", "un secret bien gardé");
    comptes.creerCompte.mockRejectedValue(new Error("base injoignable"));
    await envoi("nom@exemple.fr", "un secret bien gardé").catch(() => {});
    for (const espion of journal) expect(JSON.stringify(espion.mock.calls)).not.toContain("un secret bien gardé");
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await envoi("nom@")).toEqual(ETAT_INITIAL);
  });
});
