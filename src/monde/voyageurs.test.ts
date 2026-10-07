import { describe, expect, it } from "vitest";
import { VOYAGEUR_ATTEND_HEURES, VOYAGEUR_TOUTES_LES_HEURES } from "@/reglages";
import { departDuVoyageur, ecartAvantVoyageur, recitDAccueil } from "./voyageurs";

const HEURE = 3_600_000;
const MINUTE = 60_000;
const MOYENNE = VOYAGEUR_TOUTES_LES_HEURES * HEURE;

/** Les écarts de 200 Territoires sur leurs 500 premières arrivées : 100 000 tirages. */
function tirages(): number[] {
  const ecarts: number[] = [];
  for (let territoire = 1; territoire <= 200; territoire++) {
    for (let numero = 1; numero <= 500; numero++) ecarts.push(ecartAvantVoyageur(territoire, numero));
  }
  return ecarts;
}

describe("l'écart entre deux arrivées de Voyageurs (US-0331)", () => {
  const ecarts = tirages();

  it("vaut en moyenne la moyenne réglée, à moins de 3 minutes près sur 100 000 tirages", () => {
    const moyenne = ecarts.reduce((somme, e) => somme + e, 0) / ecarts.length;
    // L'écart type d'une moyenne de 100 000 tirages uniformes sur 8 heures est d'environ 26 secondes.
    expect(Math.abs(moyenne - MOYENNE)).toBeLessThan(3 * 60_000);
  });

  it("va de la moitié à une fois et demie la moyenne, et couvre tout l'intervalle", () => {
    const [min, max] = [Math.min(...ecarts), Math.max(...ecarts)];
    expect(min).toBeGreaterThanOrEqual(MOYENNE / 2);
    expect(max).toBeLessThan(MOYENNE * 1.5);
    expect(min).toBeLessThan(MOYENNE / 2 + 60_000);
    expect(max).toBeGreaterThan(MOYENNE * 1.5 - 60_000);
    expect(ecarts.every(Number.isInteger)).toBe(true);
  });

  it("tombe aussi souvent dans chaque huitième de l'intervalle : un tirage uniforme", () => {
    const parts = Array.from({ length: 8 }, () => 0);
    for (const e of ecarts) parts[Math.floor(((e - MOYENNE / 2) / MOYENNE) * 8)] += 1;
    // 12 500 attendus dans chacun ; l'écart type est d'environ 105.
    for (const n of parts) expect(Math.abs(n - ecarts.length / 8)).toBeLessThan(600);
  });

  it("est irrégulier : d'une arrivée à l'autre et d'un Territoire à l'autre, la suite change", () => {
    const suite = (territoire: number) => Array.from({ length: 20 }, (_, i) => ecartAvantVoyageur(territoire, i + 1));
    expect(new Set(suite(7)).size).toBe(20);
    expect(suite(7)).not.toEqual(suite(8));
  });

  it("est reproductible : le même Territoire et le même numéro donnent toujours le même écart", () => {
    expect(ecartAvantVoyageur(42, 3)).toBe(ecartAvantVoyageur(42, 3));
    // Des valeurs fixées : la base tire les mêmes (voyageurs.db.test.ts) ; les changer changerait la suite de chacun.
    expect([ecartAvantVoyageur(1, 1), ecartAvantVoyageur(1, 2), ecartAvantVoyageur(303, 1)]).toEqual(ECARTS_FIXES);
  });
});

/** Les écarts du Territoire 1 pour ses arrivées 1 et 2, et du Territoire 303 pour sa première, en millisecondes. */
const ECARTS_FIXES = [37_883_206, 39_482_426, 38_074_376];

describe("le départ d'un Voyageur (US-0333)", () => {
  it("vient VOYAGEUR_ATTEND_HEURES heures de jeu après son arrivée, à la milliseconde", () => {
    const arrive = new Date("2026-10-07T08:00:00.123Z");
    expect(departDuVoyageur(arrive)).toEqual(new Date(arrive.getTime() + VOYAGEUR_ATTEND_HEURES * HEURE));
    // L'instant d'arrivée qu'on lui confie reste tel quel.
    expect(arrive.toISOString()).toBe("2026-10-07T08:00:00.123Z");
  });

  it("laisse une attente de quelques heures entières", () => {
    expect(Number.isInteger(VOYAGEUR_ATTEND_HEURES)).toBe(true);
    expect(VOYAGEUR_ATTEND_HEURES).toBeGreaterThan(0);
    expect(VOYAGEUR_ATTEND_HEURES).toBeLessThanOrEqual(48);
  });
});

describe("le Récit d'un Voyageur accueilli (US-0334)", () => {
  /** L'heure du jeu de l'accueil. */
  const ACCUEIL = new Date("2026-10-07T18:00:00Z");
  /** Un Voyageur arrivé `ms` millisecondes de jeu avant l'accueil. */
  const arriveIlYa = (ms: number) => new Date(ACCUEIL.getTime() - ms);

  it("annonce le nouvel Habitant, et dit en une phrase depuis quand il attendait, à l'heure de l'accueil", () => {
    expect(recitDAccueil("Ines", arriveIlYa(3 * HEURE + 20 * MINUTE), ACCUEIL)).toEqual({
      titre: "Ines a rejoint le Territoire",
      texte: "Ines, qui attendait aux portes depuis 3 h, vit désormais au Foyer.",
      survenuLe: ACCUEIL,
    });
  });

  it.each([
    [30_000, "moins d'une minute"],
    [MINUTE, "1 min"],
    [59 * MINUTE + 59_000, "59 min"],
    [HEURE, "1 h"],
    [11 * HEURE + 59 * MINUTE, "11 h"],
  ])("compte l'attente comme la ligne aux portes : %i ms, « %s »", (ms, attente) => {
    expect(recitDAccueil("Joran", arriveIlYa(ms), ACCUEIL).texte).toBe(`Joran, qui attendait aux portes depuis ${attente}, vit désormais au Foyer.`);
  });
});
