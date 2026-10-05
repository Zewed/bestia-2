import { describe, expect, it } from "vitest";
import { ECART_ENTRE_FOYERS } from "@/reglages";
import { casesDeLaCouronne, graineDuMonde } from "./couronne";
import { emplacementsDeFoyers, peutAccueillirUnFoyer } from "./foyers";
import { distance } from "./hex";

describe("Cases où un Foyer peut naître (US-0152)", () => {
  const prairie = { q: 0, r: -60, biome: "prairie" };

  it("accueille un Foyer sur une prairie libre, loin des autres", () => {
    expect(peutAccueillirUnFoyer(prairie, [])).toBe(true);
  });

  it.each(["foret", "montagne", "savane", "desert", "eau"])("n'accueille jamais de Foyer hors de la prairie (%s), donc jamais sur l'eau", (biome) => {
    expect(peutAccueillirUnFoyer({ ...prairie, biome }, [])).toBe(false);
  });

  it("ne propose jamais une Case déjà possédée", () => {
    expect(peutAccueillirUnFoyer({ ...prairie, possedee: true }, [])).toBe(false);
  });

  it("garde 4 Cases au moins entre deux Foyers", () => {
    expect(ECART_ENTRE_FOYERS).toBe(4);
    expect(peutAccueillirUnFoyer(prairie, [{ q: 3, r: -60 }])).toBe(false);
    expect(peutAccueillirUnFoyer(prairie, [{ q: 4, r: -60 }])).toBe(true);
  });

  it("estime la place de la Couronne d'Aube à environ 90 Foyers, tous en prairie et assez éloignés", () => {
    const couronne = casesDeLaCouronne({ rayon: 60, anneaux: 6, graine: graineDuMonde("Aube") });
    const emplacements = emplacementsDeFoyers(couronne, []);
    expect(emplacements.length).toBeGreaterThan(75);
    const biomeDe = new Map(couronne.map((c) => [`${c.q},${c.r}`, c.biome]));
    for (const e of emplacements) expect(biomeDe.get(`${e.q},${e.r}`)).toBe("prairie");
    for (const [i, a] of emplacements.entries()) for (const b of emplacements.slice(i + 1)) expect(distance(a, b)).toBeGreaterThanOrEqual(4);
  });

  it("tient compte des Foyers déjà nés", () => {
    const couronne = casesDeLaCouronne({ rayon: 60, anneaux: 6, graine: graineDuMonde("Aube") });
    const libres = emplacementsDeFoyers(couronne, []);
    const apres = emplacementsDeFoyers(couronne, libres.slice(0, 10));
    expect(apres.length).toBe(libres.length - 10);
  });
});
