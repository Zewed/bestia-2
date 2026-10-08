import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPARITIONS_PAR_CASE_PAR_JOUR } from "@/reglages";
import { apparitions } from "./betes-sauvages";
import { casesDesAnneaux } from "./hex";

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;
/** Un instant du jeu quelconque, pas à l'heure pile. */
const DEBUT = new Date("2026-10-08T09:17:23.456Z");
const apres = (ms: number) => new Date(DEBUT.getTime() + ms);
const GRAINE = 12345;
const ICI = { q: 7, r: -3 };

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
