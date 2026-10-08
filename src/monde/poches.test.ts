import { describe, expect, it, vi } from "vitest";
import { COURONNE_ANNEAUX, MONDE_RAYON, POCHE_DE_PRAIRIE_CASES, POCHES_DE_PRAIRIE } from "@/reglages";
import { anneau, centre } from "./hex";
import { pochesDePrairie } from "./poches";
import { grilleDuMonde, regionsDe } from "./regions";

const grille = grilleDuMonde(MONDE_RAYON);
const ESSAI = { rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, graine: 12345 };
/** Vingt graines quelconques, comme pour le reste de la génération. */
const GRAINES = Array.from({ length: 20 }, (_, i) => 1 + i * 7919);

describe("poches de prairie de la Couronne (US-0413)", () => {
  it.each(GRAINES)("réserve 24 poches de 40 Cases d'un seul tenant, toutes dans la Couronne (graine %i)", (graine) => {
    const poche = pochesDePrairie(grille, { ...ESSAI, graine });
    const cases = grille.cases.filter((_, i) => poche[i]);
    expect(cases).toHaveLength(POCHES_DE_PRAIRIE * POCHE_DE_PRAIRIE_CASES);
    for (const c of cases) expect(anneau(c)).toBeGreaterThan(MONDE_RAYON - COURONNE_ANNEAUX);
    // Deux poches voisines peuvent se toucher et n'en faire qu'une ; aucune n'est plus petite que 40 Cases.
    const poches = regionsDe(grille, poche, (i) => poche[i]);
    expect(poches.length).toBeLessThanOrEqual(POCHES_DE_PRAIRIE);
    expect(poches.length).toBeGreaterThanOrEqual(POCHES_DE_PRAIRIE / 2);
    for (const p of poches) expect(p.length).toBeGreaterThanOrEqual(POCHE_DE_PRAIRIE_CASES);
  });

  it.each(GRAINES)("les répartit régulièrement sur tout le tour de la Couronne : chaque secteur de 30° en a une part (graine %i)", (graine) => {
    const poche = pochesDePrairie(grille, { ...ESSAI, graine });
    const angles = grille.cases.filter((_, i) => poche[i]).map((c) => ((Math.atan2(centre(c).y, centre(c).x) * 180) / Math.PI + 360) % 360);
    for (let debut = 0; debut < 360; debut++) expect(angles.some((a) => (a - debut + 360) % 360 < 30), `${debut}°`).toBe(true);
  });

  it("tire leur place de la graine, et d'elle seule : la même graine donne les mêmes poches, une autre d'autres", () => {
    const hasard = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Pas de hasard hors de la graine.");
    });
    try {
      expect(pochesDePrairie(grille, ESSAI)).toEqual(pochesDePrairie(grille, ESSAI));
      const une = pochesDePrairie(grille, ESSAI);
      const autre = pochesDePrairie(grille, { ...ESSAI, graine: 54321 });
      expect(une.filter((p, i) => p && !autre[i]).length).toBeGreaterThan(POCHE_DE_PRAIRIE_CASES * 4);
    } finally {
      hasard.mockRestore();
    }
  });
});
