import { afterEach, describe, expect, it, vi } from "vitest";
import { EMAIL_INVALIDE, EMAIL_VIDE } from "@/comptes/email";
import { inscrire } from "./actions";
import { ETAT_INITIAL } from "./etat";

const envoi = (email: string) => {
  const donnees = new FormData();
  donnees.set("email", email);
  donnees.set("motDePasse", "un mot de passe");
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

  it("accepte une adresse bien écrite", async () => {
    expect(await envoi("nom@exemple.fr")).toEqual({ erreurs: {}, email: "nom@exemple.fr" });
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await envoi("nom@")).toEqual(ETAT_INITIAL);
  });
});
