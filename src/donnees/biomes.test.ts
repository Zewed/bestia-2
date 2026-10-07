import { describe, expect, it } from "vitest";
import { lireJeu, valider } from "./charger";
import { BIOMES, lireDonnees, PRODUCTIONS, VARIANTES, verifierProductions } from "./jeux";

describe("Biomes", () => {
  const biomes = lireJeu(BIOMES);

  it("comptent les neuf milieux du Monde, avec leur nom en français", () => {
    expect(biomes.map((b) => [b.id, b.nom])).toEqual([
      ["prairie", "Prairie"],
      ["foret", "Forêt"],
      ["jungle", "Jungle"],
      ["savane", "Savane"],
      ["desert", "Désert"],
      ["montagne", "Montagne"],
      ["toundra", "Toundra"],
      ["banquise", "Banquise"],
      ["eau", "Eau"],
    ]);
  });

  it("font de l'eau un seul Biome, décliné en côte, lac, rivière et mer", () => {
    expect(lireJeu(VARIANTES).map((v) => [v.id, v.nom, v.biomeId])).toEqual([
      ["cote", "Côte", "eau"],
      ["lac", "Lac", "eau"],
      ["riviere", "Rivière", "eau"],
      ["mer", "Mer", "eau"],
    ]);
  });

  describe("production (US-0209)", () => {
    const productions = lireJeu(PRODUCTIONS);
    const RESSOURCES = ["viande", "vegetaux", "bois", "pierre"];

    it("donne pour chaque Biome, eau comprise, ce qu'une Case produit par heure de chacune des quatre Ressources", () => {
      for (const b of biomes) {
        expect(productions.filter((p) => p.biomeId === b.id).map((p) => p.ressourceId), b.id).toEqual(RESSOURCES);
      }
      for (const p of productions) expect(p.parHeure).toBeGreaterThanOrEqual(0);
      expect(() => lireDonnees()).not.toThrow();
    });

    it("fait produire à chaque Biome au moins une Ressource", () => {
      for (const b of biomes) expect(productions.filter((p) => p.biomeId === b.id && p.parHeure > 0).length, b.id).toBeGreaterThan(0);
    });

    it("refuse une production négative", () => {
      expect(() => valider(PRODUCTIONS, [{ biomeId: "prairie", ressourceId: "bois", parHeure: -1 }])).toThrow(
        "entrée n° 1 (parHeure) : la production ne peut pas être négative",
      );
    });

    it("refuse un Biome à qui il manque une Ressource, ou qui en produit une inconnue", () => {
      const sansPierre = productions.filter((p) => !(p.biomeId === "prairie" && p.ressourceId === "pierre"));
      expect(() => verifierProductions(sansPierre, { biomes: ["prairie"], ressources: RESSOURCES })).toThrow("prairie : production de pierre manquante");
      expect(() =>
        verifierProductions([...productions, { biomeId: "prairie", ressourceId: "or", parHeure: 1 }], { biomes: ["prairie"], ressources: RESSOURCES }),
      ).toThrow("prairie : Ressource inconnue « or »");
    });
  });
});

