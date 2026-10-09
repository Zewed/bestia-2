import { describe, expect, it } from "vitest";
import { sexeDUneBeteDeNaissance } from "@/monde/betes-de-naissance";
import { apparitions, type Sexe, sexeTire, tirerUnSexe } from "@/monde/betes-sauvages";
import { graineDuMonde } from "@/monde/couronne";
import { casesDesAnneaux } from "@/monde/hex";
import { MONDE_RAYON, SIMULATION_DES_SEXES_APPRIVOISEMENTS, SIMULATION_DES_SEXES_TOLERANCE_POINTS } from "@/reglages";

const JOUR_MS = 86_400_000;
/** Des Mondes d'essai, chacun de la graine de son nom, comme à sa génération. */
const MONDES = ["Aube", "Essai du sexe (US-0937)", "Brume", "Zéphyr", "Lande"];

/** La part des mâles parmi `sexes`, en pourcentage. */
const partDesMales = (sexes: Sexe[]) => (100 * sexes.filter((s) => s === "male").length) / sexes.length;

/**
 * Les `n` premières Bêtes sauvages d'un Monde de graine `graine`, jour après jour, Case après Case, sur toutes ses Cases
 * (un Monde généré n'a encore aucun Territoire), chacune supposée apprivoisée : le sexe que son Apprivoisement lui donne.
 */
function apprivoiserLesBetesDUnMonde(graine: number, n: number): Sexe[] {
  const sexes: Sexe[] = [];
  for (let jour = 0; sexes.length < n; jour++) {
    for (const c of casesDesAnneaux(0, MONDE_RAYON)) {
      for (const { numero } of apparitions(graine, c, new Date(jour * JOUR_MS), new Date((jour + 1) * JOUR_MS))) {
        if (sexes.length < n) sexes.push(sexeTire({ graine, ...c }, numero));
      }
    }
  }
  return sexes;
}

describe("le sexe tiré au hasard (US-0937)", () => {
  it("tire mâle ou femelle à chances égales : mâle sous la moitié, femelle au-dessus", () => {
    expect([0, 0.25, 0.4999].map(tirerUnSexe)).toEqual(["male", "male", "male"]);
    expect([0.5, 0.75, 0.9999].map(tirerUnSexe)).toEqual(["femelle", "femelle", "femelle"]);
  });

  it("ne dépend que du Monde et de la Bête : la même Bête a toujours le même sexe, quand qu'on le tire", () => {
    const graine = graineDuMonde("Essai du sexe (US-0937)");
    const sur = apparitions(graine, { q: 7, r: -3 }, new Date(0), new Date(20 * JOUR_MS));
    const premiers = sur.map((b) => sexeTire({ graine, q: 7, r: -3 }, b.numero));
    expect(sur.map((b) => sexeTire({ graine, q: 7, r: -3 }, b.numero))).toEqual(premiers);
    // Sur une même Case, les deux sexes viennent ; ailleurs ou dans un autre Monde, la même Bête n'a pas forcément le même.
    expect(new Set(premiers)).toEqual(new Set(["male", "femelle"]));
    expect(sexeDUneBeteDeNaissance(graine, 42)).toBe(sexeDUneBeteDeNaissance(graine, 42));
  });

  it(`sur ${SIMULATION_DES_SEXES_APPRIVOISEMENTS} Apprivoisements de Bêtes sauvages, mâles et femelles sont à parts égales, à ${SIMULATION_DES_SEXES_TOLERANCE_POINTS} points près`, () => {
    for (const nom of MONDES) {
      const part = partDesMales(apprivoiserLesBetesDUnMonde(graineDuMonde(nom), SIMULATION_DES_SEXES_APPRIVOISEMENTS));
      expect({ nom, ecart: Math.abs(part - 50) <= SIMULATION_DES_SEXES_TOLERANCE_POINTS }).toEqual({ nom, ecart: true });
    }
  });

  it(`sur ${SIMULATION_DES_SEXES_APPRIVOISEMENTS} Apprivoisements de Bêtes de naissance, mâles et femelles sont à parts égales, à ${SIMULATION_DES_SEXES_TOLERANCE_POINTS} points près`, () => {
    for (const nom of MONDES) {
      const graine = graineDuMonde(nom);
      const part = partDesMales(Array.from({ length: SIMULATION_DES_SEXES_APPRIVOISEMENTS }, (_, i) => sexeDUneBeteDeNaissance(graine, i + 1)));
      expect({ nom, ecart: Math.abs(part - 50) <= SIMULATION_DES_SEXES_TOLERANCE_POINTS }).toEqual({ nom, ecart: true });
    }
  });
});
