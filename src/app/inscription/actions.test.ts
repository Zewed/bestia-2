import { afterEach, describe, expect, it, vi } from "vitest";
import { EMAIL_INVALIDE, EMAIL_VIDE } from "@/comptes/email";
import { MOT_DE_PASSE_TROP_COURT, MOT_DE_PASSE_TROP_LONG } from "@/comptes/mot-de-passe";
import { inscrire } from "./actions";
import { ETAT_INITIAL } from "./etat";

const envoi = (email: string, motDePasse = "une phrase de passe") => {
  const donnees = new FormData();
  donnees.set("email", email);
  donnees.set("motDePasse", motDePasse);
  return inscrire(ETAT_INITIAL, donnees);
};

describe("envoi du formulaire d'inscription", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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

  it("accepte une adresse bien écrite", async () => {
    expect(await envoi("nom@exemple.fr")).toEqual({ erreurs: {}, email: "nom@exemple.fr" });
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await envoi("nom@")).toEqual(ETAT_INITIAL);
  });
});
