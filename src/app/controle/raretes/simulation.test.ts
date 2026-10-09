import { describe, expect, it, vi } from "vitest";
import { lireRaretesParAnneau } from "@/donnees/jeux";
import { anneauDUneCase } from "@/monde/anneaux";
import { apparitions, betesSauvages, rangerLesEspeces } from "@/monde/betes-sauvages";
import { genererLeMonde } from "@/monde/generer";
import { casesDesAnneaux } from "@/monde/hex";
import { ANNEAUX_DU_MONDE, APPARITIONS_PAR_CASE_PAR_JOUR, COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, MONDE_RAYON, SIMULATION_DES_RARETES_JOURS, SIMULATION_DES_RARETES_TOLERANCE_POINTS } from "@/reglages";
import { simulerLesRaretes } from "./simulation";

const JOUR = 86_400_000;
const DEBUT = new Date("2026-10-09T00:00:00Z");
const GRAINE = 12345;
const CHANCES = lireRaretesParAnneau();
/** Un petit Monde de 469 Cases, pour les essais rapides : sa Couronne sur 2 anneaux de Cases, son Cœur sauvage de rayon 3. */
const PETIT = { rayon: 12, anneauxCouronne: 2, rayonCoeur: 3 };
/** Une Espèce de chaque Rareté dans la prairie : aucune Bête n'y retombe sur une Rareté inférieure (US-0928). */
const PRAIRIE = rangerLesEspeces(CHANCES[0].map(({ rareteId }) => ({ id: rareteId, rareteId, biomeId: "prairie" })));

describe("la simulation des Raretés par Anneau (US-0931)", () => {
  const simulation = simulerLesRaretes({ graine: GRAINE });

  it(`simule ${SIMULATION_DES_RARETES_JOURS} jours de jeu, Anneau par Anneau, sur toutes les Cases d'un Monde généré`, () => {
    expect(simulation.jours).toBe(SIMULATION_DES_RARETES_JOURS);
    expect(simulation.anneaux.map((a) => a.anneau)).toEqual(Array.from({ length: ANNEAUX_DU_MONDE }, (_, i) => i + 1));
    const forme = { rayon: MONDE_RAYON, anneauxCouronne: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON };
    const monde = genererLeMonde({ rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON, graine: GRAINE });
    for (const { anneau, cases } of simulation.anneaux) expect(cases, `Anneau ${anneau}`).toBe(monde.filter((c) => anneauDUneCase(c, forme) === anneau).length);
    // De la Couronne au Cœur sauvage.
    expect(simulation.anneaux[0].cases).toBe(monde.filter((c) => c.couronne).length);
    expect(simulation.anneaux.at(-1)!.cases).toBe(monde.filter((c) => c.coeur).length);
  });

  it("compte chaque apparition de la période, et la Rareté que le jeu donne à sa Bête", () => {
    const petite = simulerLesRaretes({ graine: GRAINE, de: DEBUT, forme: PETIT, jours: 10 });
    const a = new Date(DEBUT.getTime() + 10 * JOUR);
    for (const anneau of petite.anneaux) {
      const comptes = new Map<string, number>();
      let nombre = 0;
      for (const c of casesDesAnneaux(0, PETIT.rayon).filter((x) => anneauDUneCase(x, PETIT) === anneau.anneau)) {
        nombre += apparitions(GRAINE, c, DEBUT, a).length;
        // Les Bêtes arrivées pendant la période, et pas celles encore là depuis la veille.
        for (const b of betesSauvages({ ...c, graine: GRAINE, anneau: anneau.anneau, biome: "prairie" }, DEBUT, a, PRAIRIE).filter((x) => x.arrivee >= DEBUT)) {
          comptes.set(b.rareteId, (comptes.get(b.rareteId) ?? 0) + 1);
        }
      }
      expect(anneau.apparitions).toBe(nombre);
      for (const { rareteId, obtenue } of anneau.raretes) expect(obtenue, `Anneau ${anneau.anneau}, ${rareteId}`).toBeCloseTo((100 * (comptes.get(rareteId) ?? 0)) / nombre, 9);
    }
  });

  it("affiche pour chaque Anneau la part obtenue de chaque Rareté à côté de la part attendue", () => {
    simulation.anneaux.forEach(({ anneau, apparitions: nombre, raretes }) => {
      expect(raretes.map((r) => [r.rareteId, r.attendue])).toEqual(CHANCES[anneau - 1].map((c) => [c.rareteId, c.pourcent]));
      expect(raretes.reduce((s, r) => s + r.obtenue, 0)).toBeCloseTo(100, 9);
      for (const { rareteId, obtenue, attendue } of raretes) {
        // À quatre écarts types près : un tirage juste n'en sort pratiquement jamais.
        const p = attendue / 100;
        expect(Math.abs(obtenue - attendue), `Anneau ${anneau}, ${rareteId}`).toBeLessThan(400 * Math.sqrt((p * (1 - p)) / nombre));
      }
    });
  });

  it(`marque chaque Rareté qui s'écarte de plus de ${SIMULATION_DES_RARETES_TOLERANCE_POINTS} point de sa part attendue, et vérifie que les communes restent majoritaires`, () => {
    expect(simulation.tolerance).toBe(SIMULATION_DES_RARETES_TOLERANCE_POINTS);
    for (const { raretes, communesMajoritaires } of simulation.anneaux) {
      // Les communes : la première Rareté de la table, plus de la moitié dans chaque Anneau.
      expect(communesMajoritaires).toBe(raretes[0].obtenue > 50);
      expect(communesMajoritaires).toBe(true);
      for (const r of raretes) expect(r.horsTolerance).toBe(Math.abs(r.obtenue - r.attendue) > SIMULATION_DES_RARETES_TOLERANCE_POINTS);
    }
    expect(simulation.reussie).toBe(simulation.anneaux.every((a) => a.communesMajoritaires && !a.raretes.some((r) => r.horsTolerance)));
  });

  it("réussit tant que chaque écart reste dans la tolérance, échoue dès que l'un la dépasse, et marque les Raretés en cause", () => {
    const petite = (tolerance: number) => simulerLesRaretes({ graine: GRAINE, de: DEBUT, forme: PETIT, tolerance });
    const ecarts = petite(100).anneaux.flatMap((a) => a.raretes.map((r) => Math.abs(r.obtenue - r.attendue)));
    const plusGrand = Math.max(...ecarts);
    // Un écart égal à la tolérance ne la dépasse pas.
    expect(petite(plusGrand).reussie).toBe(true);
    const stricte = petite(plusGrand / 2);
    expect(stricte.reussie).toBe(false);
    for (const { raretes } of stricte.anneaux) {
      for (const r of raretes) expect(r.horsTolerance).toBe(Math.abs(r.obtenue - r.attendue) > plusGrand / 2);
    }
    expect(stricte.anneaux.flatMap((a) => a.raretes).filter((r) => r.horsTolerance).length).toBeGreaterThan(0);
  });

  it("échoue quand les communes ne sont pas majoritaires dans un Anneau, même dans la tolérance", () => {
    // Une table où les communes ne font que 45 % au Cœur sauvage.
    const chances = CHANCES.map((ligne, i) =>
      i < ANNEAUX_DU_MONDE - 1 ? ligne : ligne.map((c) => ({ ...c, pourcent: { commune: 45, peu_commune: 35 }[c.rareteId] ?? c.pourcent })),
    );
    const resultat = simulerLesRaretes({ graine: GRAINE, de: DEBUT, forme: PETIT, chances, tolerance: 100 });
    expect(resultat.reussie).toBe(false);
    expect(resultat.anneaux.map((a) => a.communesMajoritaires)).toEqual([true, true, true, true, true, false]);
    expect(resultat.anneaux.flatMap((a) => a.raretes).some((r) => r.horsTolerance)).toBe(false);
  });

  it("donne le nombre moyen d'apparitions par Case et par jour de chaque Anneau", () => {
    for (const { cases, apparitions: nombre, parCaseParJour } of simulation.anneaux) {
      expect(parCaseParJour).toBeCloseTo(nombre / (cases * SIMULATION_DES_RARETES_JOURS), 12);
      expect(parCaseParJour).toBeCloseTo(APPARITIONS_PAR_CASE_PAR_JOUR, 0);
    }
    const toutes = simulation.anneaux.reduce((s, a) => s + a.apparitions, 0) / (casesDesAnneaux(0, MONDE_RAYON).length * SIMULATION_DES_RARETES_JOURS);
    expect(toutes).toBeCloseTo(APPARITIONS_PAR_CASE_PAR_JOUR, 1);
  });

  it("simule toujours la même période : une même graine donne le même résultat quel que soit le jour, une autre graine un autre", () => {
    const petite = (graine: number) => simulerLesRaretes({ graine, forme: PETIT });
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(DEBUT);
      const aujourdHui = petite(GRAINE);
      vi.setSystemTime(new Date(DEBUT.getTime() + 45 * JOUR + 3_600_000));
      expect(petite(GRAINE)).toEqual(aujourdHui);
      expect(petite(GRAINE + 1).anneaux.map((a) => a.apparitions)).not.toEqual(aujourdHui.anneaux.map((a) => a.apparitions));
    } finally {
      vi.useRealTimers();
    }
  });
});
