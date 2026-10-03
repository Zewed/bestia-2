import { describe, expect, it } from "vitest";
import { MOT_DE_PASSE_TROP_COURT, MOT_DE_PASSE_TROP_LONG, REGLE_MOT_DE_PASSE, verifierMotDePasse } from "./mot-de-passe";

describe("règle du mot de passe", () => {
  it("s'écrit avec le chiffre réglé", () => {
    expect(REGLE_MOT_DE_PASSE).toBe("Au moins 12 caractères.");
    expect(MOT_DE_PASSE_TROP_COURT).toBe("Le mot de passe doit contenir au moins 12 caractères");
  });

  it.each(["", "court", "a".repeat(11)])("refuse un mot de passe trop court (%s)", (valeur) => {
    expect(verifierMotDePasse(valeur)).toBe(MOT_DE_PASSE_TROP_COURT);
  });

  it("refuse un mot de passe démesuré", () => {
    expect(verifierMotDePasse("a".repeat(129))).toBe(MOT_DE_PASSE_TROP_LONG);
  });

  it.each(["a".repeat(12), "a".repeat(128), "une phrase de passe", "            "])("accepte « %s », sans exiger chiffre ni symbole", (valeur) => {
    expect(verifierMotDePasse(valeur)).toBeNull();
  });

  it("compte un emoji pour un seul caractère", () => {
    expect(verifierMotDePasse("🐺".repeat(11))).toBe(MOT_DE_PASSE_TROP_COURT);
    expect(verifierMotDePasse("🐺".repeat(12))).toBeNull();
  });
});
