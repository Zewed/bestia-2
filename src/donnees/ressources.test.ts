import { describe, expect, it } from "vitest";
import { lireJeu, valider } from "./charger";
import { RESSOURCES } from "./jeux";

describe("Ressources (US-0201)", () => {
  const ressources = lireJeu(RESSOURCES);

  it("sont la Viande, les Végétaux, le Bois et la Pierre, dans cet ordre", () => {
    expect(ressources.map((r) => [r.id, r.nom, r.ordre])).toEqual([
      ["viande", "Viande", 1],
      ["vegetaux", "Végétaux", 2],
      ["bois", "Bois", 3],
      ["pierre", "Pierre", 4],
    ]);
  });

  it("rangent la Viande et les Végétaux en Nourriture, le Bois et la Pierre en Matériaux", () => {
    expect(Object.fromEntries(ressources.map((r) => [r.id, r.famille]))).toEqual({
      viande: "nourriture",
      vegetaux: "nourriture",
      bois: "materiaux",
      pierre: "materiaux",
    });
  });

  it("refusent une famille inconnue, en disant laquelle", () => {
    expect(() => valider(RESSOURCES, [{ id: "or", nom: "Or", famille: "tresor", ordre: 1 }])).toThrow(
      "entrée n° 1 (famille) : famille : nourriture ou materiaux",
    );
  });
});
