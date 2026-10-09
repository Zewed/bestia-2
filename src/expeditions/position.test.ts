import { describe, expect, it } from "vitest";
import type { Coordonnees } from "@/monde/hex";
import { cheminDUneExpedition } from "./chemin";
import { type HorairesDUneExpedition, sejourDUneExpedition } from "./phase";
import { passagesDUneExpedition, positionDUneExpedition } from "./position";

const MINUTE_MS = 60_000;
const DEPART = new Date("2026-10-09T07:42:00.000Z");
/** Une heure du jeu, `minutes` après le départ. */
const apres = (minutes: number) => new Date(DEPART.getTime() + minutes * MINUTE_MS);

const FOYER: Coordonnees = { q: 12, r: -7 };
/** Une destination à 3 Cases à l'est du Foyer : son chemin passe par (13, -7) et (14, -7). */
const DESTINATION: Coordonnees = { q: 15, r: -7 };
const [PREMIERE, DEUXIEME] = cheminDUneExpedition(FOYER, DESTINATION);
/** 3 Cases au pas des explorateurs, 20 minutes chacune : 60 minutes d'aller, puis 4 h de séjour, puis 60 minutes de retour. */
const EXPEDITION: HorairesDUneExpedition = { partLe: DEPART, trajetMinutes: 60, sejourMinutes: 240 };
/** Où en est l'Expédition `minutes` après son départ. */
const a = (minutes: number, horaires = EXPEDITION) => positionDUneExpedition(FOYER, DESTINATION, horaires, apres(minutes));

describe("la position d'une Expédition sur son chemin (US-0913)", () => {
  it("part du Foyer, puis atteint chaque Case de son chemin l'une après l'autre, une par pas de son allure", () => {
    expect(a(0)).toEqual({ avancee: 0, rang: 0, case: FOYER });
    expect(a(19)).toMatchObject({ rang: 0, case: FOYER });
    expect(a(20)).toEqual({ avancee: 1, rang: 1, case: PREMIERE });
    expect(a(39)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(40)).toEqual({ avancee: 2, rang: 2, case: DEUXIEME });
  });

  it("dit aussi où elle en est entre deux Cases, en fraction de Case faite depuis le Foyer", () => {
    expect(a(5).avancee).toBeCloseTo(0.25, 12);
    expect(a(50).avancee).toBeCloseTo(2.5, 12);
  });

  it("atteint sa destination à l'arrivée pile, et y reste pendant tout le séjour", () => {
    expect(a(59)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(60)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
    expect(a(60 + 239)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
  });

  it("rentre par le même chemin, Case par Case, à la même allure, et retrouve le Foyer à son retour", () => {
    const retour = 60 + 240;
    expect(a(retour)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
    // Elle est encore sur la destination tant qu'elle n'a pas atteint la Case d'avant.
    expect(a(retour + 10)).toMatchObject({ rang: 3, case: DESTINATION });
    expect(a(retour + 10).avancee).toBeCloseTo(2.5, 12);
    expect(a(retour + 20)).toEqual({ avancee: 2, rang: 2, case: DEUXIEME });
    expect(a(retour + 41)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(retour + 60)).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("reste au Foyer une fois rentrée", () => {
    expect(a(60 + 240 + 60 + 24 * 60)).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("avance au pas de son escorte : une allure plus lente espace d'autant les Cases (US-0912)", () => {
    // 3 Cases à 50 minutes chacune.
    const lente = { ...EXPEDITION, trajetMinutes: 150 };
    expect(a(49, lente)).toMatchObject({ rang: 0, case: FOYER });
    expect(a(50, lente)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(149, lente)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(150, lente)).toMatchObject({ rang: 3, case: DESTINATION });
  });

  it("reste au Foyer tant que le trajet d'une escorte n'est pas chiffré (US-0912), comme d'un trajet nul, que la base refuse", () => {
    expect(a(30 * 24 * 60, { ...EXPEDITION, trajetMinutes: null })).toEqual({ avancee: 0, rang: 0, case: FOYER });
    for (const minutes of [0, 240, 241]) expect(a(minutes, { ...EXPEDITION, trajetMinutes: 0 })).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("donne la même Case que celle de la carte, jamais une copie : la carte reconnaît ainsi qu'elle n'a pas bougé", () => {
    const chemin = cheminDUneExpedition(FOYER, DESTINATION);
    expect(positionDUneExpedition(FOYER, DESTINATION, EXPEDITION, apres(0), chemin).case).toBe(FOYER);
    expect(positionDUneExpedition(FOYER, DESTINATION, EXPEDITION, apres(25), chemin).case).toBe(chemin[0]);
    expect(positionDUneExpedition(FOYER, DESTINATION, EXPEDITION, apres(60), chemin).case).toBe(chemin[2]);
  });
});

describe("l'heure de passage sur chaque Case du chemin (US-0914)", () => {
  /** Les passages de l'Expédition aux horaires `horaires`, vers `destination`. */
  const passages = (horaires = EXPEDITION, destination = DESTINATION) => passagesDUneExpedition(FOYER, destination, horaires);

  it("dit, à l'aller, quand l'Expédition atteint chaque Case de son chemin, une par pas de son allure, jusqu'à la destination", () => {
    expect(passages()).toEqual([
      { case: PREMIERE, rang: 1, le: apres(20) },
      { case: DEUXIEME, rang: 2, le: apres(40) },
      { case: DESTINATION, rang: 3, le: apres(60) },
    ]);
  });

  it("atteint la destination à l'arrivée pile, quand commence le séjour, quelle que soit l'allure", () => {
    for (const trajetMinutes of [60, 150, 7, 1]) {
      const horaires = { ...EXPEDITION, trajetMinutes };
      expect(passages(horaires).at(-1)).toEqual({ case: DESTINATION, rang: 3, le: sejourDUneExpedition(horaires)!.debut });
    }
  });

  it("est l'heure même où la position l'y pose, à la milliseconde près, même quand l'allure ne tombe pas juste", () => {
    // 7 Cases en 1, 61 ou 1 000 minutes : des allures qui ne font pas un nombre entier de millisecondes.
    const loin: Coordonnees = { q: 19, r: -7 };
    for (const trajetMinutes of [1, 61, 1_000, 60]) {
      const horaires = { ...EXPEDITION, trajetMinutes };
      const chemin = cheminDUneExpedition(FOYER, loin);
      const tous = passagesDUneExpedition(FOYER, loin, horaires);
      expect(tous.map((p) => p.case)).toEqual(chemin);
      for (const { case: laCase, rang, le } of tous) {
        expect(positionDUneExpedition(FOYER, loin, horaires, le)).toMatchObject({ rang, case: laCase });
        expect(positionDUneExpedition(FOYER, loin, horaires, new Date(le.getTime() - 1)).rang).toBe(rang - 1);
      }
    }
  });

  it("n'en dit aucun tant que le trajet d'une escorte n'est pas chiffré (US-0912) : elle reste au Foyer", () => {
    expect(passages({ ...EXPEDITION, trajetMinutes: null })).toEqual([]);
    expect(passages({ ...EXPEDITION, trajetMinutes: 0 })).toEqual([]);
  });

  it("donne les Cases mêmes du chemin qu'on lui passe, jamais des copies", () => {
    const chemin = cheminDUneExpedition(FOYER, DESTINATION);
    expect(passagesDUneExpedition(FOYER, DESTINATION, EXPEDITION, chemin).map((p) => p.case)).toSatisfy((cases: Coordonnees[]) =>
      cases.every((c, i) => c === chemin[i]),
    );
  });
});

describe("le demi-tour d'une Expédition rappelée (US-0920)", () => {
  /** Rappelée à mi-chemin entre la deuxième Case et la destination, 50 minutes après son départ. */
  const RAPPELEE = { ...EXPEDITION, rappeleeLe: apres(50) };

  it("fait demi-tour là où elle en est, et revient au Foyer au même pas, le retour durant le temps déjà parcouru", () => {
    expect(a(50, RAPPELEE).avancee).toBeCloseTo(2.5, 12);
    expect(a(60, RAPPELEE).avancee).toBeCloseTo(2, 12);
    expect(a(60, RAPPELEE)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(70, RAPPELEE)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(80, RAPPELEE)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(100, RAPPELEE)).toEqual({ avancee: 0, rang: 0, case: FOYER });
    expect(a(100 + 24 * 60, RAPPELEE)).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("n'atteint jamais la Case vers laquelle elle allait : elle est toujours sur la dernière qu'elle a atteinte", () => {
    for (const minutes of [50, 51, 55, 59]) expect(a(minutes, RAPPELEE)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(60, RAPPELEE).avancee).toBeLessThan(3);
  });

  it("rappelée en séjour, repart de la destination au rappel, pour un retour aussi long que l'aller", () => {
    const enSejour = { ...EXPEDITION, rappeleeLe: apres(60 + 30) };
    expect(a(60 + 29, enSejour)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
    expect(a(60 + 30 + 10, enSejour).avancee).toBeCloseTo(2.5, 12);
    expect(a(60 + 30 + 20, enSejour)).toEqual({ avancee: 2, rang: 2, case: DEUXIEME });
    expect(a(60 + 30 + 60, enSejour)).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("ne passe plus sur aucune Case après son rappel : ses passages s'arrêtent au demi-tour", () => {
    expect(passagesDUneExpedition(FOYER, DESTINATION, RAPPELEE)).toEqual([
      { case: PREMIERE, rang: 1, le: apres(20) },
      { case: DEUXIEME, rang: 2, le: apres(40) },
    ]);
    // Rappelée à l'instant même où elle atteint une Case, elle l'a atteinte.
    expect(passagesDUneExpedition(FOYER, DESTINATION, { ...EXPEDITION, rappeleeLe: apres(40) }).map((p) => p.rang)).toEqual([1, 2]);
    expect(passagesDUneExpedition(FOYER, DESTINATION, { ...EXPEDITION, rappeleeLe: apres(40 - 1 / 60_000) }).map((p) => p.rang)).toEqual([1]);
    expect(passagesDUneExpedition(FOYER, DESTINATION, { ...EXPEDITION, rappeleeLe: DEPART })).toEqual([]);
    // Rappelée en séjour, elle était arrivée : tous ses passages.
    expect(passagesDUneExpedition(FOYER, DESTINATION, { ...EXPEDITION, rappeleeLe: apres(61) })).toHaveLength(3);
  });
});
