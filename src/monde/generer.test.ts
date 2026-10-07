import { describe, expect, it, vi } from "vitest";
import { BIOMES_DE_LA_COURONNE, COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { BANDE_DE_CALCUL, casesDeLaCouronne, graineDuMonde } from "./couronne";
import { GRAINE_MAX, genererLeMonde, lireUneGraine } from "./generer";
import { voisines } from "./hex";

const ESSAI = { rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, graine: 12345 };
const cle = (c: { q: number; r: number }) => `${c.q},${c.r}`;

describe("générer un Monde à partir d'une graine (US-0401)", () => {
  const monde = genererLeMonde(ESSAI);

  it("rend toutes les Cases du Monde, du Cœur sauvage au bord : 10 981 pour 60 anneaux, chacune unique", () => {
    expect(monde).toHaveLength(3 * 60 * 61 + 1);
    expect(monde).toHaveLength(10_981);
    expect(new Set(monde.map(cle)).size).toBe(monde.length);
    expect(Math.min(...monde.map((c) => c.anneau))).toBe(0);
    expect(Math.max(...monde.map((c) => c.anneau))).toBe(60);
  });

  it("donne toujours les mêmes Cases avec les mêmes Biomes à la même graine, Case par Case", () => {
    const encore = new Map(genererLeMonde(ESSAI).map((c) => [cle(c), c]));
    expect(encore.size).toBe(monde.length);
    for (const c of monde) expect(encore.get(cle(c))).toEqual(c);
  });

  it("donne un autre Monde à une autre graine", () => {
    const autre = new Map(genererLeMonde({ ...ESSAI, graine: 54321 }).map((c) => [cle(c), c.biome]));
    const differentes = monde.filter((c) => autre.get(cle(c)) !== c.biome).length;
    expect(differentes / monde.length).toBeGreaterThan(0.3);
  });

  it.each([12345, graineDuMonde("Aube")])("fait des 6 anneaux extérieurs la Couronne, exactement celle que donne la même graine (graine %i)", (graine) => {
    const couronne = casesDeLaCouronne({ ...ESSAI, graine });
    const cases = genererLeMonde({ ...ESSAI, graine });
    expect(cases.filter((c) => c.couronne)).toEqual(couronne.map((c) => ({ ...c, couronne: true })));
    for (const c of cases) expect(c.couronne).toBe(c.anneau > MONDE_RAYON - COURONNE_ANNEAUX);
  });

  it.each([12345, 777, graineDuMonde("Aube")])("prolonge le même relief vers l'intérieur : tous les Biomes y sont, en régions, sans tache d'une ou deux Cases (graine %i)", (graine) => {
    const cases = genererLeMonde({ ...ESSAI, graine });
    const biomeDe = new Map(cases.map((c) => [cle(c), c.biome]));
    const interieur = cases.filter((c) => !c.couronne);
    expect(new Set(interieur.map((c) => c.biome))).toEqual(new Set(Object.keys(BIOMES_DE_LA_COURONNE)));
    for (const c of interieur) expect(c.variante).toBe(c.biome === "eau" ? "lac" : null);
    let paires = 0;
    let pareilles = 0;
    for (const c of interieur) {
      for (const v of voisines(c)) {
        paires++;
        if (biomeDe.get(cle(v)) === c.biome) pareilles++;
      }
    }
    expect(pareilles / paires).toBeGreaterThan(0.75);
    // Les régions de tout le Monde, la Couronne comprise, comptent toutes au moins 3 Cases.
    const vu = new Set<string>();
    const tailles: number[] = [];
    for (const c of cases) {
      if (vu.has(cle(c))) continue;
      const region = [c];
      vu.add(cle(c));
      for (let k = 0; k < region.length; k++) {
        for (const v of voisines(region[k])) {
          if (!vu.has(cle(v)) && biomeDe.get(cle(v)) === c.biome) {
            vu.add(cle(v));
            region.push({ ...c, ...v });
          }
        }
      }
      tailles.push(region.length);
    }
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(3);
  });

  it("ne tire aucun hasard d'ailleurs que de la graine", () => {
    const hasard = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Pas de hasard hors de la graine.");
    });
    try {
      expect(genererLeMonde(ESSAI)).toEqual(monde);
    } finally {
      hasard.mockRestore();
    }
  });

  it("refuse une Couronne plus large que la bande de calcul, comme la Couronne elle-même", () => {
    expect(() => genererLeMonde({ ...ESSAI, anneaux: BANDE_DE_CALCUL + 1 })).toThrow();
  });

  it("lit une graine : un nombre entier de 0 à 2³² − 1, rien d'autre", () => {
    expect(lireUneGraine("12345")).toBe(12345);
    expect(lireUneGraine("0")).toBe(0);
    expect(lireUneGraine(String(2 ** 32 - 1))).toBe(GRAINE_MAX);
    for (const texte of ["", "abc", "-1", "1.5", "1e3", String(2 ** 32)]) expect(() => lireUneGraine(texte)).toThrow(`Une graine est un nombre entier de 0 à 4294967295, pas « ${texte} ».`);
  });
});
