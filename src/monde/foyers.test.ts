import { describe, expect, it } from "vitest";
import { ECART_ENTRE_FOYERS } from "@/reglages";
import { casesDeLaCouronne, graineDuMonde } from "./couronne";
import { alerteDePlaces, choisirCaseDeNaissance, emplacementsDeFoyers, peutAccueillirUnFoyer } from "./foyers";
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

describe("Case où naît un nouveau chef (US-0153)", () => {
  const couronne = casesDeLaCouronne({ rayon: 60, anneaux: 6, graine: graineDuMonde("Aube") });
  const libres = couronne.filter((c) => peutAccueillirUnFoyer(c, []));

  it("fait naître le premier chef d'un Monde sur une Case libre tirée au hasard", () => {
    expect(choisirCaseDeNaissance(couronne, [], null, () => 0)).toEqual(libres[0]);
    expect(choisirCaseDeNaissance(couronne, [], null, () => 0.9999)).toEqual(libres[libres.length - 1]);
  });

  it("fait naître les suivants au hasard parmi les 5 emplacements libres les plus proches du dernier arrivé", () => {
    const dernier = choisirCaseDeNaissance(couronne, [], null, () => 0.5)!;
    const tires = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const c = choisirCaseDeNaissance(couronne, [dernier], dernier, () => i / 50)!;
      expect(peutAccueillirUnFoyer(c, [dernier])).toBe(true);
      tires.add(`${c.q},${c.r}`);
    }
    expect(tires.size).toBe(5);
    const plusLoinTire = Math.max(...[...tires].map((t) => distance(dernier, { q: Number(t.split(",")[0]), r: Number(t.split(",")[1]) })));
    const libresApres = couronne.filter((c) => peutAccueillirUnFoyer(c, [dernier]));
    expect(libresApres.filter((c) => distance(c, dernier) < plusLoinTire).length).toBeLessThan(5);
  });

  it("ne trouve rien quand la Couronne est pleine", () => {
    const pleine = emplacementsDeFoyers(couronne, []);
    expect(choisirCaseDeNaissance(couronne, pleine, pleine[0], () => 0)).toBeNull();
  });
});

describe("alerte quand la Couronne se remplit (US-0159)", () => {
  it("se tait tant qu'il reste au moins 10 places", () => {
    expect(alerteDePlaces("Aube", 10)).toBeNull();
    expect(alerteDePlaces("Aube", 90)).toBeNull();
  });

  it("prévient sous 10 places, et quand le Monde est complet", () => {
    expect(alerteDePlaces("Aube", 9)).toBe("Alerte : plus que 9 places de Foyer dans Aube.");
    expect(alerteDePlaces("Aube", 1)).toBe("Alerte : plus que 1 place de Foyer dans Aube.");
    expect(alerteDePlaces("Aube", 0)).toBe("Alerte : Aube est complet, aucun nouveau chef ne peut y naître.");
  });
});

