import { describe, expect, it } from "vitest";
import { EMAIL_INVALIDE, EMAIL_VIDE, normaliserEmail, verifierEmail } from "./email";

describe("format de l'adresse e-mail", () => {
  it.each(["", "   "])("demande l'adresse quand le champ est vide (« %s »)", (valeur) => {
    expect(verifierEmail(valeur)).toBe(EMAIL_VIDE);
  });

  it.each(["nom@", "nom.fr", "nom@exemple", "@exemple.fr", "nom@.fr", "nom@exemple.", "nom prenom@exemple.fr", "nom@@exemple.fr", `${"a".repeat(250)}@exemple.fr`])(
    "refuse « %s »",
    (valeur) => {
      expect(verifierEmail(valeur)).toBe(EMAIL_INVALIDE);
    },
  );

  it.each(["nom@exemple.fr", "prenom.nom+bestia@mail.exemple.co.uk", "  nom@exemple.fr  ", "Nom@Exemple.FR"])("accepte « %s »", (valeur) => {
    expect(verifierEmail(valeur)).toBeNull();
  });
});

describe("adresse enregistrée", () => {
  it.each([
    ["  nom@exemple.fr  ", "nom@exemple.fr"],
    ["Nom@Exemple.fr", "nom@exemple.fr"],
    [" PRENOM.NOM@MAIL.EXEMPLE.FR\t", "prenom.nom@mail.exemple.fr"],
  ])("« %s » devient « %s »", (saisie, enregistree) => {
    expect(normaliserEmail(saisie)).toBe(enregistree);
  });

  it("donne la même adresse pour « Nom@Exemple.fr » et « nom@exemple.fr »", () => {
    expect(normaliserEmail("Nom@Exemple.fr")).toBe(normaliserEmail("nom@exemple.fr"));
  });
});
