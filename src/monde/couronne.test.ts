import { describe, expect, it } from "vitest";
import { BIOMES_DE_LA_COURONNE, COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { casesDeLaCouronne, graineDuMonde } from "./couronne";
import { voisines } from "./hex";

const AUBE = { rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, graine: graineDuMonde("Aube") };

describe("Couronne d'un Monde (US-0151)", () => {
  const couronne = casesDeLaCouronne(AUBE);
  const cle = (c: { q: number; r: number }) => `${c.q},${c.r}`;

  it("fait des 3 anneaux extérieurs d'un Monde de 60 anneaux la Couronne : 1 062 Cases, chacune unique", () => {
    expect([MONDE_RAYON, COURONNE_ANNEAUX]).toEqual([60, 3]);
    expect(couronne).toHaveLength(6 * (58 + 59 + 60));
    expect(new Set(couronne.map(cle)).size).toBe(couronne.length);
    expect(new Set(couronne.map((c) => c.anneau))).toEqual(new Set([58, 59, 60]));
  });

  it("donne à chaque Biome sa part, à deux points près, la prairie en tête", () => {
    const parts = Object.fromEntries(Object.keys(BIOMES_DE_LA_COURONNE).map((b) => [b, couronne.filter((c) => c.biome === b).length / couronne.length]));
    for (const [biome, part] of Object.entries(BIOMES_DE_LA_COURONNE)) expect(Math.abs(parts[biome] - part)).toBeLessThanOrEqual(0.02);
    expect(BIOMES_DE_LA_COURONNE.prairie).toBe(0.4);
  });

  it("range les Biomes en régions d'un seul tenant, pas en damier", () => {
    const biomeDe = new Map(couronne.map((c) => [cle(c), c.biome]));
    let paires = 0;
    let pareilles = 0;
    for (const c of couronne) {
      for (const v of voisines(c)) {
        const autre = biomeDe.get(cle(v));
        if (!autre) continue;
        paires++;
        if (autre === c.biome) pareilles++;
      }
    }
    // Au hasard, deux voisines partageraient leur Biome une fois sur quatre environ.
    expect(pareilles / paires).toBeGreaterThan(0.75);
  });

  it.each(["Aube", "Crépuscule", "Zénith"])("ne laisse aucune tache d'une ou deux Cases (Monde %s)", (nom) => {
    const cases = casesDeLaCouronne({ ...AUBE, graine: graineDuMonde(nom) });
    const biomeDe = new Map(cases.map((c) => [cle(c), c.biome]));
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

  it("fait de l'eau de la Couronne des lacs, et rien d'autre n'a de variante", () => {
    for (const c of couronne) expect(c.variante).toBe(c.biome === "eau" ? "lac" : null);
  });

  it("donne toujours la même Couronne au même Monde, et une autre à un autre Monde", () => {
    expect(casesDeLaCouronne(AUBE)).toEqual(couronne);
    const autre = casesDeLaCouronne({ ...AUBE, graine: graineDuMonde("Crépuscule") });
    const differentes = autre.filter((c, i) => c.biome !== couronne[i].biome).length;
    expect(differentes / couronne.length).toBeGreaterThan(0.3);
  });
});
