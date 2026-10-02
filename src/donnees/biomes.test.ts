import { describe, expect, it } from "vitest";
import { lireJeu } from "./charger";
import { BIOMES, VARIANTES } from "./jeux";

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
});
