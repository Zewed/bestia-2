import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lireRaretesParAnneau } from "@/donnees/jeux";
import { ANNEAUX_DU_MONDE, APPARITIONS_PAR_CASE_PAR_JOUR, PRESENCE_D_UNE_BETE_HEURES } from "@/reglages";
import { apparitions, betesSauvages, tirerUneRarete } from "./betes-sauvages";
import { casesDesAnneaux } from "./hex";

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;
/** Un instant du jeu quelconque, pas à l'heure pile. */
const DEBUT = new Date("2026-10-08T09:17:23.456Z");
const apres = (ms: number) => new Date(DEBUT.getTime() + ms);
const GRAINE = 12345;
const ICI = { q: 7, r: -3 };
/** La même Case, telle que les Bêtes sauvages la voient : dans la Couronne d'un Monde de graine GRAINE. */
const LA_CASE = { ...ICI, graine: GRAINE, anneau: 1 };

describe("des Bêtes sauvages apparaissent de temps en temps (US-0925)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it(`en fait apparaître en moyenne ${APPARITIONS_PAR_CASE_PAR_JOUR} par Case et par jour du jeu`, () => {
    const cases = casesDesAnneaux(0, 12); // 469 Cases
    const jours = 60;
    const total = cases.reduce((n, c) => n + apparitions(GRAINE, c, DEBUT, apres(jours * JOUR)).length, 0);
    expect(total / (cases.length * jours)).toBeCloseTo(APPARITIONS_PAR_CASE_PAR_JOUR, 1);
    // Chaque Case en voit, aucune n'en voit sans cesse.
    for (const c of cases.slice(0, 50)) expect(apparitions(GRAINE, c, DEBUT, apres(jours * JOUR)).length).toBeGreaterThan(jours / 4);
  });

  it("se règle : deux fois plus d'apparitions par jour en donnent deux fois plus", () => {
    const cases = casesDesAnneaux(0, 8);
    const compter = (parJour: number) => cases.reduce((n, c) => n + apparitions(GRAINE, c, DEBUT, apres(30 * JOUR), parJour).length, 0);
    expect(compter(2) / compter(1)).toBeCloseTo(2, 0);
    expect(compter(24) / (cases.length * 30)).toBeCloseTo(24, 0);
  });

  it("les fait apparaître à des moments au hasard, indépendants : parfois deux dans la même heure, parfois rien pendant des jours", () => {
    const liste = apparitions(GRAINE, ICI, DEBUT, apres(365 * JOUR));
    const ecarts = liste.slice(1).map((x, i) => x.arrivee.getTime() - liste[i].arrivee.getTime());
    expect(Math.min(...ecarts)).toBeLessThan(HEURE);
    expect(Math.max(...ecarts)).toBeGreaterThan(3 * JOUR);
    // Les minutes des arrivées se répartissent sur toute l'heure.
    const quarts = new Set(liste.map((x) => Math.floor(x.arrivee.getUTCMinutes() / 15)));
    expect(quarts.size).toBe(4);
  });

  it("donne à chaque apparition une seule Bête, et un numéro propre à sa Case qui ne revient jamais", () => {
    const liste = apparitions(GRAINE, ICI, DEBUT, apres(365 * JOUR));
    expect(new Set(liste.map((x) => x.numero)).size).toBe(liste.length);
    // Rangées dans l'ordre du temps, leurs numéros ne font que croître.
    for (let i = 1; i < liste.length; i++) {
      expect(liste[i].arrivee.getTime()).toBeGreaterThanOrEqual(liste[i - 1].arrivee.getTime());
      expect(liste[i].numero).toBeGreaterThan(liste[i - 1].numero);
    }
  });

  it("ne garde que les apparitions de la période, bornes comprises au début, exclues à la fin", () => {
    const liste = apparitions(GRAINE, ICI, DEBUT, apres(30 * JOUR));
    const [premiere, derniere] = [liste[0], liste.at(-1)!];
    expect(apparitions(GRAINE, ICI, premiere.arrivee, derniere.arrivee)).toEqual(liste.slice(0, -1));
    expect(apparitions(GRAINE, ICI, premiere.arrivee, new Date(derniere.arrivee.getTime() + 1))).toEqual(liste);
    expect(apparitions(GRAINE, ICI, DEBUT, DEBUT)).toEqual([]);
  });

  it("a lieu que les joueurs soient là ou non : calculées après coup, ce sont les mêmes qu'en direct", () => {
    vi.useFakeTimers();
    vi.setSystemTime(apres(JOUR));
    const enDirect = apparitions(GRAINE, ICI, DEBUT, apres(JOUR));
    vi.setSystemTime(apres(400 * JOUR));
    expect(apparitions(GRAINE, ICI, DEBUT, apres(JOUR))).toEqual(enDirect);
  });

  it("donne à chaque Case, et à chaque Monde, ses propres apparitions", () => {
    const moments = (graine: number, c: { q: number; r: number }) => apparitions(graine, c, DEBUT, apres(30 * JOUR)).map((x) => x.arrivee.getTime());
    expect(moments(GRAINE, ICI)).toEqual(moments(GRAINE, { ...ICI }));
    expect(moments(GRAINE, ICI)).not.toEqual(moments(GRAINE, { q: 7, r: -2 }));
    expect(moments(GRAINE, ICI)).not.toEqual(moments(GRAINE + 1, ICI));
  });

  it("ne montre aucune Bête sauvage sur la carte : rien de la carte ne les lit", () => {
    const carte = [
      ...readdirSync("src/app/jeu/carte").map((f) => join("src/app/jeu/carte", f)),
      "src/monde/carte.ts",
      "src/monde/brouillard.ts",
      "src/monde/fiche.ts",
    ];
    for (const fichier of carte) expect(readFileSync(fichier, "utf8"), fichier).not.toMatch(/betes-sauvages/);
  });
});

describe("une présence limitée dans le temps (US-0926)", () => {
  const PRESENCE = PRESENCE_D_UNE_BETE_HEURES * HEURE;
  /** Les numéros des Bêtes présentes sur la Case à l'instant `t`. */
  const presentes = (t: Date, parties?: Map<number, Date>) => betesSauvages(LA_CASE, t, new Date(t.getTime() + 1), { parties }).map((b) => b.numero);
  const betes = betesSauvages(LA_CASE, DEBUT, apres(30 * JOUR));

  it(`garde chaque Bête ${PRESENCE_D_UNE_BETE_HEURES} heures sur sa Case, la même durée pour toutes, puis elle disparaît`, () => {
    expect(betes.length).toBeGreaterThan(10);
    for (const b of betes) {
      expect(b.depart.getTime() - b.arrivee.getTime()).toBe(PRESENCE);
      expect(presentes(new Date(b.arrivee.getTime() - 1))).not.toContain(b.numero);
      expect(presentes(b.arrivee)).toContain(b.numero);
      expect(presentes(new Date(b.depart.getTime() - 1))).toContain(b.numero);
      expect(presentes(b.depart)).not.toContain(b.numero);
    }
  });

  it("compte toutes les Bêtes présentes pendant la période, même arrivées avant elle", () => {
    // Une période qui commence une heure après l'arrivée d'une Bête : elle y est encore.
    const de = new Date(betes[5].arrivee.getTime() + HEURE);
    const pendant = betesSauvages(LA_CASE, de, new Date(de.getTime() + JOUR));
    expect(pendant.map((b) => b.numero)).toContain(betes[5].numero);
    expect(pendant.map((b) => b.numero)).toEqual(apparitions(GRAINE, ICI, new Date(de.getTime() - PRESENCE + 1), new Date(de.getTime() + JOUR)).map((x) => x.numero));
  });

  it("laisse parfois plusieurs Bêtes ensemble sur une même Case", () => {
    const annee = betesSauvages(LA_CASE, DEBUT, apres(365 * JOUR));
    expect(Math.max(...annee.map((b) => presentes(b.arrivee).length))).toBeGreaterThanOrEqual(2);
  });

  it("ne fait jamais revenir une Bête disparue : chacune n'est là que pendant sa présence, d'un seul tenant", () => {
    const quarts = new Map<number, number[]>();
    for (let k = 0; k < 30 * 24 * 4; k++) {
      for (const numero of presentes(apres((k * HEURE) / 4))) quarts.set(numero, [...(quarts.get(numero) ?? []), k]);
    }
    expect(quarts.size).toBeGreaterThan(10);
    for (const [numero, vus] of quarts) {
      expect(vus.at(-1)! - vus[0] + 1, `${numero}`).toBe(vus.length);
      expect(vus.length).toBeLessThanOrEqual(PRESENCE_D_UNE_BETE_HEURES * 4 + 1);
    }
  });

  it("fait quitter aussitôt sa Case à une Bête qui suit une Expédition, pour toujours, sans rien changer aux autres", () => {
    const suivie = betes[3];
    const instant = new Date(suivie.arrivee.getTime() + 2 * HEURE);
    const parties = new Map([[suivie.numero, instant]]);
    expect(presentes(new Date(instant.getTime() - 1), parties)).toContain(suivie.numero);
    expect(presentes(instant, parties)).not.toContain(suivie.numero);
    expect(betesSauvages(LA_CASE, instant, apres(60 * JOUR), { parties }).map((b) => b.numero)).not.toContain(suivie.numero);
    expect(betesSauvages(LA_CASE, DEBUT, apres(30 * JOUR), { parties })).toEqual(betes.map((b) => (b === suivie ? { ...b, depart: instant } : b)));
  });
});

describe("la Rareté tirée selon l'Anneau (US-0927)", () => {
  const chances = lireRaretesParAnneau();
  /** Combien de Bêtes de chaque Rareté apparaissent dans l'Anneau `anneau`, sur 271 Cases et 120 jours du jeu : quelque 32 000. */
  const simuler = (anneau: number) => {
    const comptes = new Map<string, number>();
    for (const c of casesDesAnneaux(0, 9)) {
      for (const b of betesSauvages({ ...c, graine: GRAINE, anneau }, DEBUT, apres(120 * JOUR))) comptes.set(b.rareteId, (comptes.get(b.rareteId) ?? 0) + 1);
    }
    const total = [...comptes.values()].reduce((s, n) => s + n, 0);
    return { comptes, total, part: (rareteId: string) => (comptes.get(rareteId) ?? 0) / total };
  };
  const simulations = Array.from({ length: ANNEAUX_DU_MONDE }, (_, i) => simuler(i + 1));

  it("tire la Rareté de chaque Bête aux pourcentages de l'Anneau de sa Case, sur une longue simulation", () => {
    simulations.forEach(({ total, part }, i) => {
      expect(total).toBeGreaterThan(30_000);
      for (const { rareteId, pourcent } of chances[i]) {
        // À quatre écarts types près : un tirage juste n'en sort pratiquement jamais.
        const p = pourcent / 100;
        expect(Math.abs(part(rareteId) - p), `Anneau ${i + 1}, ${rareteId}`).toBeLessThan(4 * Math.sqrt((p * (1 - p)) / total));
      }
    });
  });

  it("fait apparaître partout toutes les Raretés de commune à légendaire, les communes toujours les plus nombreuses", () => {
    for (const { comptes, part } of simulations) {
      expect([...comptes.keys()].sort()).toEqual(["commune", "epique", "legendaire", "peu_commune", "rare"]);
      for (const rareteId of comptes.keys()) expect(part("commune")).toBeGreaterThanOrEqual(part(rareteId));
      expect(part("commune")).toBeGreaterThan(0.5);
    }
  });

  it("en fait apparaître de plus rares à mesure qu'on approche du Cœur sauvage", () => {
    for (const rareteId of ["peu_commune", "rare", "epique", "legendaire"]) {
      const parts = simulations.map(({ part }) => part(rareteId));
      for (let i = 1; i < parts.length; i++) expect(parts[i], `${rareteId}, Anneau ${i + 1}`).toBeGreaterThan(parts[i - 1]);
    }
  });

  it("ne fait jamais apparaître une Bête mythique ainsi, quel que soit le hasard", () => {
    for (const { comptes } of simulations) expect(comptes.has("mythique")).toBe(false);
    for (const ligne of chances) {
      for (const hasard of [0, 0.5, 0.999999, 1 - Number.EPSILON]) expect(tirerUneRarete(ligne, hasard)).not.toBe("mythique");
    }
    expect(tirerUneRarete(chances[0], 0)).toBe("commune");
    expect(tirerUneRarete(chances[0], 1 - Number.EPSILON)).toBe("legendaire");
  });

  it("garde la même Rareté à une Bête, quelle que soit la période où on la calcule", () => {
    const anneau6 = { ...LA_CASE, anneau: ANNEAUX_DU_MONDE };
    const mois = betesSauvages(anneau6, DEBUT, apres(30 * JOUR));
    for (const b of mois) {
      expect(betesSauvages(anneau6, b.arrivee, new Date(b.arrivee.getTime() + 1)).find((x) => x.numero === b.numero)).toEqual(b);
    }
  });
});
