import { describe, expect, it } from "vitest";
import { lireJeu, valider } from "./charger";
import { BIOMES, lireDonnees, lireVoisinagesInterdits, PRODUCTIONS, VARIANTES, verifierProductions } from "./jeux";

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

describe("voisinages interdits (US-0407)", () => {
  const paires = lireVoisinagesInterdits();
  const interdit = (a: string, b: string) => paires.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  it("interdisent au moins la banquise contre le désert, la jungle et la savane, la toundra contre le désert et la jungle, le désert contre la jungle", () => {
    for (const [a, b] of [
      ["banquise", "desert"],
      ["banquise", "jungle"],
      ["banquise", "savane"],
      ["toundra", "desert"],
      ["toundra", "jungle"],
      ["desert", "jungle"],
    ]) {
      expect(interdit(a, b), `${a} · ${b}`).toBe(true);
    }
  });

  it("gardent les Biomes froids loin des chauds : banquise et toundra ne touchent jamais désert, savane ni jungle", () => {
    for (const froid of ["banquise", "toundra"]) for (const chaud of ["desert", "savane", "jungle"]) expect(interdit(froid, chaud), `${froid} · ${chaud}`).toBe(true);
  });

  it("ne nomment que des Biomes de terre, chaque paire une seule fois, sans Biome interdit à côté de lui-même", () => {
    const terre = lireJeu(BIOMES)
      .map((b) => b.id)
      .filter((id) => id !== "eau");
    for (const [a, b] of paires) {
      expect(terre).toContain(a);
      expect(terre).toContain(b);
      expect(a < b, `${a} · ${b}`).toBe(true);
    }
    expect(new Set(paires.map((p) => p.join(" · "))).size).toBe(paires.length);
    // Prairie, forêt et montagne vont avec tout : elles peuvent toujours séparer deux Biomes qui ne se touchent pas.
    for (const libre of ["prairie", "foret", "montagne"]) expect(paires.filter((p) => p.includes(libre))).toEqual([]);
  });
});

