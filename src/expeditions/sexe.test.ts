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

  it("ne dépend que du Monde et de la Bête : la même Bête a le même sexe quel que soit le moment où on le tire", () => {
    const graine = graineDuMonde("Essai du sexe (US-0937)");
    const ici = { graine, q: 7, r: -3 };
    /** Le sexe de chaque Bête de la Case apparue dans [de, a), par son numéro. */
    const sexesDe = (de: number, a: number, laCase = ici) =>
      apparitions(laCase.graine, laCase, new Date(de * JOUR_MS), new Date(a * JOUR_MS)).map((b) => [b.numero, sexeTire(laCase, b.numero)] as const);
    // Vingt jours d'un bloc, puis jour après jour : les mêmes Bêtes, chacune avec le même sexe.
    const dUnBloc = sexesDe(0, 20);
    expect(Array.from({ length: 20 }, (_, jour) => sexesDe(jour, jour + 1)).flat()).toEqual(dUnBloc);
    // Sur une même Case, les deux sexes viennent.
    expect(new Set(dUnBloc.map(([, sexe]) => sexe))).toEqual(new Set(["male", "femelle"]));
    // Dans un autre Monde, les mêmes numéros n'ont pas les mêmes sexes : le tirage tient à la graine.
    const ailleurs = { ...ici, graine: graineDuMonde("Un autre Monde (US-0937)") };
    expect(dUnBloc.map(([numero]) => sexeTire(ailleurs, numero))).not.toEqual(dUnBloc.map(([, sexe]) => sexe));
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
