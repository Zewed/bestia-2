import { describe, expect, it } from "vitest";
import { NOM_DE_CHEF_MAX, NOM_DE_CHEF_MIN } from "@/reglages";
import { couperNom, longueurDuNom, NOM_TROP_COURT, NOM_TROP_LONG, verifierLongueurDuNom } from "./nom";

describe("longueur du nom de chef (US-0132)", () => {
  it("va de 3 à 16 caractères", () => {
    expect([NOM_DE_CHEF_MIN, NOM_DE_CHEF_MAX]).toEqual([3, 16]);
    expect(NOM_TROP_COURT).toBe("3 caractères minimum");
    expect(NOM_TROP_LONG).toBe("16 caractères maximum");
  });

  it("compte les caractères tels qu'on les voit, sans les espaces autour", () => {
    expect(longueurDuNom("Élan")).toBe(4);
    expect(longueurDuNom("Élan")).toBe(4); // le même « É », écrit en deux morceaux
    expect(longueurDuNom("  Ourse  ")).toBe(5);
    expect(longueurDuNom("Ours brun")).toBe(9);
  });

  it.each([
    ["", NOM_TROP_COURT],
    ["Ou", NOM_TROP_COURT],
    ["  Ou  ", NOM_TROP_COURT],
    ["Élu", null],
    ["Seize caractères", null],
    ["Dix-sept lettres!", NOM_TROP_LONG],
  ])("« %s » : %s", (nom, message) => {
    expect(verifierLongueurDuNom(nom)).toBe(message);
  });

  it("coupe un collage trop long à 16 caractères, sans casser un accent", () => {
    expect(couperNom("Le grand ours des montagnes")).toBe("Le grand ours de");
    expect(longueurDuNom(couperNom("É".repeat(20)))).toBe(16);
    expect(couperNom("É".repeat(20))).toBe("É".repeat(16));
    expect(couperNom("  Ourse")).toBe("  Ourse");
  });
});
