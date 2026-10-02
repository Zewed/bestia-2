import { describe, expect, it } from "vitest";
import { appliquerBareme } from "./bareme";

describe("barème des caractéristiques (ADR 0007)", () => {
  it("donne 1 à la fourmi, la plus petite des bêtes", () => {
    expect(appliquerBareme({ masseG: 0.005, arme: 1, nourritureGParJour: 0.001 })).toMatchObject({ attaque: 1, vie: 1 });
  });

  it("donne 473 à la souris, qui occupe une Place", () => {
    expect(appliquerBareme({ masseG: 20, arme: 1, nourritureGParJour: 4 })).toEqual({
      attaque: 473,
      vie: 473,
      taille: 1,
      charge: 5,
      entretienParHeure: 0.167,
    });
  });

  it("fait occuper à la poule la place de 32 souris", () => {
    expect(appliquerBareme({ masseG: 2000, arme: 0.4, nourritureGParJour: 120 })).toEqual({
      attaque: 5981,
      vie: 14953,
      taille: 31.623,
      charge: 500,
      entretienParHeure: 5,
    });
  });

  it("double l'arme des bêtes venimeuses", () => {
    expect(appliquerBareme({ masseG: 0.1, arme: 1, venimeux: true, nourritureGParJour: 0.02 })).toMatchObject({ attaque: 18, vie: 9 });
    expect(appliquerBareme({ masseG: 0.1, arme: 1, nourritureGParJour: 0.02 })).toMatchObject({ attaque: 9, vie: 9 });
  });

  it("laisse à zéro l'attaque d'une bête sans arme", () => {
    expect(appliquerBareme({ masseG: 500, arme: 0, nourritureGParJour: 20 }).attaque).toBe(0);
  });
});
