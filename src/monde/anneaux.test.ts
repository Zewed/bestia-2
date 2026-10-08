import { describe, expect, it } from "vitest";
import { ANNEAUX_DU_MONDE, COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { anneauDUneCase } from "./anneaux";
import { anneau, casesDesAnneaux, dansLeCoeur, tourDeLAnneau } from "./hex";

/** Un Monde de la taille du jeu : 60 anneaux de Cases, une Couronne de 6, un Cœur sauvage de 8 de rayon. */
const MONDE = { rayon: MONDE_RAYON, anneauxCouronne: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON };

/** L'Anneau de chaque anneau de Cases d'un Monde, de son centre (0) à son bord, lu sur une Case de chacun. */
const parDistance = (monde: typeof MONDE, anneaux?: number) =>
  Array.from({ length: monde.rayon + 1 }, (_, d) => anneauDUneCase(tourDeLAnneau(d)[0], monde, anneaux));

describe("les Anneaux, de la Couronne au Cœur sauvage (US-0923)", () => {
  it(`partage le Monde en ${ANNEAUX_DU_MONDE} Anneaux, numérotés de la Couronne (1) au Cœur sauvage (${ANNEAUX_DU_MONDE})`, () => {
    const anneaux = new Set(casesDesAnneaux(0, MONDE_RAYON).map((c) => anneauDUneCase(c, MONDE)));
    expect([...anneaux].sort((a, b) => a - b)).toEqual(Array.from({ length: ANNEAUX_DU_MONDE }, (_, i) => i + 1));
    expect(anneauDUneCase({ q: 0, r: -MONDE_RAYON }, MONDE)).toBe(1);
    expect(anneauDUneCase({ q: 0, r: 0 }, MONDE)).toBe(ANNEAUX_DU_MONDE);
  });

  it("fait de la Couronne exactement l'Anneau le plus extérieur, et du Cœur sauvage exactement le plus intérieur", () => {
    for (const c of casesDesAnneaux(0, MONDE_RAYON)) {
      const a = anneauDUneCase(c, MONDE);
      expect(a === 1, `${c.q},${c.r}`).toBe(anneau(c) > MONDE_RAYON - COURONNE_ANNEAUX);
      expect(a === ANNEAUX_DU_MONDE, `${c.q},${c.r}`).toBe(dansLeCoeur(c, COEUR_SAUVAGE_RAYON));
    }
  });

  it("donne le même Anneau à toutes les Cases à même distance du Cœur sauvage", () => {
    for (const d of [0, 1, 7, 8, 30, 54, 55, 60]) {
      expect(new Set(tourDeLAnneau(d).map((c) => anneauDUneCase(c, MONDE))).size).toBe(1);
    }
  });

  it("répartit les anneaux de Cases entre les deux le plus également possible, chaque Anneau d'un seul tenant", () => {
    const anneaux = parDistance(MONDE);
    // Du bord vers le centre, l'Anneau ne fait que croître, d'un cran à la fois.
    for (let d = 0; d < MONDE_RAYON; d++) expect(anneaux[d] - anneaux[d + 1]).toBeOneOf([0, 1]);
    // Les 47 anneaux de Cases du 8e au 54e, sur les Anneaux 2 à 5 : 12, 12, 12 et 11.
    const largeurs = [2, 3, 4, 5].map((a) => anneaux.filter((x) => x === a).length);
    expect(largeurs).toEqual([12, 12, 12, 11]);
    expect(anneaux.slice(43, 55)).toEqual(Array(12).fill(2));
    expect(anneaux.slice(8, 19)).toEqual(Array(11).fill(5));
  });

  it("se règle : le nombre d'Anneaux et la forme du Monde changent le partage, jamais la Couronne ni le Cœur sauvage", () => {
    expect(parDistance(MONDE, 3)).toEqual([...Array(8).fill(3), ...Array(47).fill(2), ...Array(6).fill(1)]);
    const petit = { rayon: 12, anneauxCouronne: 3, rayonCoeur: 2 };
    expect(parDistance(petit, 5)).toEqual([5, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1]);
  });

  it("refuse un partage où un Anneau resterait vide", () => {
    expect(() => anneauDUneCase({ q: 0, r: 0 }, { rayon: 12, anneauxCouronne: 3, rayonCoeur: 8 }, 5)).toThrow(/2 anneaux de Cases/);
    expect(() => anneauDUneCase({ q: 0, r: 0 }, MONDE, 2)).toThrow(/Anneaux/);
  });
});
