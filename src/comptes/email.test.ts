import { describe, expect, it } from "vitest";
import { EMAIL_INVALIDE, EMAIL_VIDE, verifierEmail } from "./email";

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
