import { describe, expect, it } from "vitest";
import { ABORDS_DU_FOYER_CASES } from "@/reglages";
import { abordsDuFoyer } from "./brouillard";
import { casesDesAnneaux, distance } from "./hex";

describe("les abords d'un Foyer (US-0436)", () => {
  it(`sont les Cases à ${ABORDS_DU_FOYER_CASES} Cases du Foyer ou moins, lui compris, et elles seules`, () => {
    const foyer = { q: 37, r: -52 };
    const abords = abordsDuFoyer(foyer);
    // Un hexagone de rayon 4 : 1 + 6 + 12 + 18 + 24 Cases.
    expect(abords).toHaveLength(1 + 3 * ABORDS_DU_FOYER_CASES * (ABORDS_DU_FOYER_CASES + 1));
    expect(new Set(abords.map((c) => `${c.q},${c.r}`)).size).toBe(abords.length);
    for (const c of abords) expect(distance(c, foyer)).toBeLessThanOrEqual(ABORDS_DU_FOYER_CASES);
    expect(abords).toContainEqual(foyer);
    // Toutes celles du voisinage à cette distance ou moins y sont, aucune au-delà.
    const voisinage = casesDesAnneaux(0, ABORDS_DU_FOYER_CASES + 2).map((c) => ({ q: c.q + foyer.q, r: c.r + foyer.r }));
    const attendues = voisinage.filter((c) => distance(c, foyer) <= ABORDS_DU_FOYER_CASES);
    expect([...abords].sort((a, b) => a.q - b.q || a.r - b.r)).toEqual(attendues.sort((a, b) => a.q - b.q || a.r - b.r));
  });

  it("suivent le rayon demandé, et ne sont que le Foyer à 0", () => {
    expect(abordsDuFoyer({ q: 0, r: 0 }, 0)).toEqual([{ q: 0, r: 0 }]);
    expect(abordsDuFoyer({ q: -3, r: 8 }, 1)).toHaveLength(7);
    expect(abordsDuFoyer({ q: -3, r: 8 }, 2)).toHaveLength(19);
  });
});
