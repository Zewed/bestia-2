import { describe, expect, it } from "vitest";
import { lireVoisinagesInterdits } from "@/donnees/jeux";
import { emplacementsDeNaissance } from "@/monde/foyers";
import { genererLeMonde } from "@/monde/generer";
import { anneau, casesDesAnneaux, distance } from "@/monde/hex";
import { COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, JOUEURS_PAR_MONDE, LACS_PAR_MONDE, MONDE_RAYON, RIVIERES_PAR_MONDE } from "@/reglages";
import { bilanDuMonde, type CaseDeCarte } from "./bilan";

const interdites = lireVoisinagesInterdits();

describe("bilan d'un Monde sur la page de contrôle (US-0412)", () => {
  const monde = genererLeMonde({ rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON, graine: 12345 });
  const bilan = bilanDuMonde(monde, interdites);

  it("donne la part de chacun des huit Biomes de terre, en part de la terre, du plus étendu au moins étendu", () => {
    const terre = monde.filter((c) => c.biome !== "eau").length;
    expect(bilan.biomes.map((b) => b.biome).sort()).toEqual(["banquise", "desert", "foret", "jungle", "montagne", "prairie", "savane", "toundra"]);
    for (const b of bilan.biomes) expect(b.part).toBeCloseTo(monde.filter((c) => c.biome === b.biome).length / terre);
    expect(bilan.biomes.reduce((s, b) => s + b.part, 0)).toBeCloseTo(1);
    expect(bilan.biomes.map((b) => b.cases)).toEqual([...bilan.biomes.map((b) => b.cases)].sort((a, b) => b - a));
  });

  it("compte les eaux, les 8 lacs et les 12 rivières du Monde généré", () => {
    expect(bilan.eaux.map((e) => e.variante).sort()).toEqual(["cote", "lac", "mer", "riviere"]);
    expect(bilan.eaux.reduce((s, e) => s + e.cases, 0)).toBe(monde.filter((c) => c.biome === "eau").length);
    expect([bilan.lacs, bilan.rivieres]).toEqual([LACS_PAR_MONDE, RIVIERES_PAR_MONDE]);
  });

  it("compte les emplacements de naissance libres : tous, dans un Monde où personne n'est né (US-0413)", () => {
    expect(bilan.foyers).toEqual([]);
    expect(bilan.emplacements).toEqual(emplacementsDeNaissance(monde));
    expect(bilan.emplacements.length).toBeGreaterThanOrEqual(JOUEURS_PAR_MONDE);
  });

  it("ne trouve aucun voisinage interdit dans un Monde généré", () => {
    expect(bilan.interdits).toEqual([]);
  });

  describe("sur un petit Monde dessiné à la main", () => {
    /** Un Monde de 6 anneaux tout en prairie, sa Couronne sur les 2 derniers ; `autres` change quelques Cases. */
    const petit = (autres: Record<string, Partial<CaseDeCarte>> = {}): CaseDeCarte[] =>
      casesDesAnneaux(0, 6).map((c) => ({ ...c, anneau: anneau(c), couronne: anneau(c) > 4, coeur: anneau(c) < 1, biome: "prairie", variante: null, ...autres[`${c.q},${c.r}`] }));

    it("signale chaque voisinage interdit une seule fois, avec ses deux Cases", () => {
      const cases = petit({ "0,0": { biome: "desert" }, "1,0": { biome: "toundra" } });
      expect(bilanDuMonde(cases, interdites).interdits).toEqual(["0,0 desert · 1,0 toundra"]);
      expect(bilanDuMonde(cases, []).interdits).toEqual([]);
    });

    it("compte chaque lac d'un seul tenant une fois, et une rivière par sa source", () => {
      const lac = { biome: "eau", variante: "lac" };
      const riviere = { biome: "eau", variante: "riviere" };
      // Deux lacs, dont un de deux Cases ; une rivière de quatre Cases qui se jette dans un troisième.
      const cases = petit({ "-3,0": lac, "-3,1": lac, "3,0": lac, "-1,-2": riviere, "0,-2": riviere, "1,-2": riviere, "2,-2": riviere, "3,-2": lac });
      const bilan = bilanDuMonde(cases, interdites);
      expect(bilan.lacs).toBe(3);
      expect(bilan.rivieres).toBe(1);
    });

    it("tient compte des Foyers déjà nés et des Cases possédées", () => {
      const libres = bilanDuMonde(petit(), interdites).emplacements;
      const premier = libres[0];
      const cases = petit({ [`${premier.q},${premier.r}`]: { possedee: true, foyer: true } });
      const bilan = bilanDuMonde(cases, interdites);
      expect(bilan.foyers).toEqual([premier]);
      expect(bilan.emplacements).not.toContainEqual(premier);
      for (const e of bilan.emplacements) expect(distance(e, premier)).toBeGreaterThanOrEqual(4);
    });
  });
});
